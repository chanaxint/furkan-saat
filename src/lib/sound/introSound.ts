"use client";

/**
 * INTRO SOUND — synthesised with the Web Audio API (no audio files).
 *
 *   rise(T)    watch ticks that keep accelerating over T seconds, over a
 *              swell of air and a low drone that climb with them
 *   impact()   the cut to black: a deep hit with a soft chime above it
 *   chime()    a quiet chime when the name arrives
 *   rewind(T)  the same ticks slowing down, under a falling whoosh
 *
 * Browsers only allow sound after the visitor clicks, taps or presses a key
 * (a mouse-wheel scroll does not count), so `unlock()` is called from those
 * events; until then everything here is silent. The visitor's on/off choice
 * is remembered.
 */

const STORAGE_KEY = "furkan-saat:ses";

/** Tick interval at the start and at the end of the rise (seconds). */
const TICK_FIRST = 0.44;
const TICK_LAST = 0.04;

type Run = { gain: GainNode; sources: AudioScheduledSourceNode[] };

class IntroSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private run: Run | null = null;
  private listeners = new Set<() => void>();
  private enabled = true;

  constructor() {
    try {
      if (typeof window !== "undefined") this.enabled = localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
      /* storage blocked: keep the default */
    }
  }

  /** Whether sound is switched on (the visitor's choice). */
  get on() {
    return this.enabled;
  }

  /** Snapshot for useSyncExternalStore: on/off and whether the browser allows playing. */
  get snapshot() {
    return `${this.enabled ? 1 : 0}${this.ready ? 1 : 0}`;
  }

  /** Whether the browser is actually letting us play. */
  get ready() {
    return this.ctx?.state === "running";
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  setOn(on: boolean) {
    this.enabled = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
    this.listeners.forEach((fn) => fn());
  }

  /** Call from a click, tap or key press. Resolves true once audio can play. */
  async unlock(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return false;
      const ctx = new Ctx();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      const master = ctx.createGain();
      master.gain.value = this.enabled ? 0.9 : 0;
      master.connect(comp).connect(ctx.destination);
      // One second of white noise, reused by every tick and swell.
      const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.master = master;
      this.noise = noise;
    }
    if (this.ctx.state !== "running") {
      try {
        await this.ctx.resume();
      } catch {
        /* not allowed yet */
      }
    }
    this.listeners.forEach((fn) => fn());
    return this.ready;
  }

  /** Stop whatever is playing, with a click-free fade of `fade` seconds. */
  stop(fade = 0.03) {
    const run = this.run;
    const ctx = this.ctx;
    this.run = null;
    if (!run || !ctx) return;
    const t = ctx.currentTime;
    run.gain.gain.cancelScheduledValues(t);
    run.gain.gain.setValueAtTime(run.gain.gain.value, t);
    run.gain.gain.linearRampToValueAtTime(0, t + fade);
    for (const s of run.sources) {
      try {
        s.stop(t + fade + 0.02);
      } catch {
        /* already stopped */
      }
    }
    window.setTimeout(() => run.gain.disconnect(), (fade + 0.2) * 1000);
  }

  /**
   * Accelerating ticks over `duration` seconds. `from` skips the part that has
   * already passed (sound unlocked after the film started).
   */
  rise(duration: number, from = 0) {
    const run = this.begin();
    if (!run) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const T = Math.max(0.5, duration);

    tickTimes(T).forEach((t, i) => {
      if (t < from) return;
      const k = t / T;
      this.tick(run, now + t - from, 0.22 + 0.5 * k, k, i);
    });

    const left = T - from;
    // Air: filtered noise that opens up and swells.
    const air = this.noiseSource(run, true);
    const lp = ctx.createBiquadFilter();
    lp.type = "bandpass";
    lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(lerpExp(220, 3200, from / T), now);
    lp.frequency.exponentialRampToValueAtTime(3200, now + left);
    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.0001 + 0.12 * (from / T) ** 2, now);
    airGain.gain.exponentialRampToValueAtTime(0.16, now + left);
    air.connect(lp).connect(airGain).connect(run.gain);
    air.start(now);

    // A low drone climbing an octave.
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.setValueAtTime(lerpExp(48, 96, from / T), now);
    drone.frequency.exponentialRampToValueAtTime(96, now + left);
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.0001 + 0.14 * (from / T), now);
    droneGain.gain.linearRampToValueAtTime(0.16, now + left);
    drone.connect(droneGain).connect(run.gain);
    drone.start(now);
    run.sources.push(drone);
  }

  /** The cut to black: everything stops dead and one deep hit rings out. */
  impact() {
    this.stop(0.012);
    const run = this.begin();
    if (!run) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.01;

    // Body: a sine that falls in pitch.
    const body = ctx.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime(82, t);
    body.frequency.exponentialRampToValueAtTime(34, t + 1.4);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0001, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.85, t + 0.012);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    body.connect(bodyGain).connect(run.gain);
    body.start(t);
    body.stop(t + 2.3);
    run.sources.push(body);

    // Attack: a short dark burst of noise.
    const hit = this.noiseSource(run, false);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 0.5);
    const hitGain = ctx.createGain();
    hitGain.gain.setValueAtTime(0.5, t);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    hit.connect(lp).connect(hitGain).connect(run.gain);
    hit.start(t);
    hit.stop(t + 0.7);

    this.bell(run, t + 0.02, 0.07, 3.2);
  }

  /** A quiet chime for the name. */
  chime() {
    const run = this.begin(false);
    if (!run) return;
    this.bell(run, this.ctx!.currentTime + 0.02, 0.05, 2.6, 1.5);
  }

  /** Ticks slowing down under a falling whoosh, over `duration` seconds. */
  rewind(duration: number) {
    const run = this.begin();
    if (!run) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const T = Math.max(0.5, duration);
    // The rise, mirrored: fast at first, slowing to a stop.
    tickTimes(T).forEach((t, i) => {
      const k = t / T;
      this.tick(run, now + (T - t), 0.16 + 0.34 * k, k, i);
    });
    const air = this.noiseSource(run, true);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(3000, now);
    bp.frequency.exponentialRampToValueAtTime(180, now + T);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, now + T);
    air.connect(bp).connect(g).connect(run.gain);
    air.start(now);
    air.stop(now + T + 0.1);
  }

  /* ------------------------------------------------------------------ */

  /** A fresh output for one sound; by default it replaces the previous one. */
  private begin(replace = true): Run | null {
    if (!this.ready || !this.enabled || !this.ctx || !this.master) return null;
    if (replace) this.stop();
    const gain = this.ctx.createGain();
    gain.connect(this.master);
    const run: Run = { gain, sources: [] };
    if (replace) this.run = run;
    return run;
  }

  private noiseSource(run: Run, loop: boolean) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = loop;
    run.sources.push(src);
    return src;
  }

  /** One mechanical tick: a filtered click, alternating tick / tock. */
  private tick(run: Run, at: number, level: number, k: number, i: number) {
    const ctx = this.ctx!;
    const src = this.noiseSource(run, false);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 9;
    // Alternate pitch like a balance wheel; it tightens as it speeds up.
    bp.frequency.value = (i % 2 ? 2500 : 3500) * (1 + 0.25 * k);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
    src.connect(bp).connect(g).connect(run.gain);
    src.start(at, Math.random() * 0.9, 0.06);
  }

  /** A soft bell: a few inharmonic partials that ring out. */
  private bell(run: Run, at: number, level: number, ring: number, pitch = 1) {
    const ctx = this.ctx!;
    for (const [ratio, amp] of [
      [1, 1],
      [2.76, 0.45],
      [5.4, 0.2],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = 659.25 * pitch * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(level * amp, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + ring / ratio);
      o.connect(g).connect(run.gain);
      o.start(at);
      o.stop(at + ring + 0.1);
      run.sources.push(o);
    }
  }
}

/** Times (s) of ticks whose interval shrinks exponentially from TICK_FIRST to TICK_LAST over T. */
function tickTimes(T: number) {
  const times: number[] = [];
  let t = 0;
  while (t < T - 0.02) {
    times.push(t);
    t += TICK_FIRST * (TICK_LAST / TICK_FIRST) ** (t / T);
  }
  return times;
}

const lerpExp = (a: number, b: number, k: number) => a * (b / a) ** Math.min(1, Math.max(0, k));

/** One shared engine for the page. */
export const introSound = new IntroSound();
