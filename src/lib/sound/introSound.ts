"use client";

/**
 * INTRO SOUND — synthesised with the Web Audio API (no audio files).
 *
 *   rise(T)    wind that gathers speed over T seconds: it brightens and swells,
 *              and its gusts come faster and faster
 *   cut()      silence, at once (with the film's cut to black)
 *   rewind(T)  the same wind falling away, for the rewind
 *
 * Sound is always on and has no controls. Browsers only allow it after the
 * visitor has clicked, tapped or pressed a key (a mouse-wheel scroll alone
 * does not count), so `unlock()` runs on those events; until then this stays
 * silent, and the wind joins the film where it is once allowed.
 */

type Run = { gain: GainNode; sources: AudioScheduledSourceNode[] };

/** Gust rate at the start and the end of the rise (Hz): the sense of speed. */
const GUST_SLOW = 0.6;
const GUST_FAST = 9;

class IntroSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private pink: AudioBuffer | null = null;
  private white: AudioBuffer | null = null;
  private run: Run | null = null;

  /** Whether the browser is actually letting us play. */
  get ready() {
    return this.ctx?.state === "running";
  }

  /** Call from a click, tap or key press. Resolves true once audio can play. */
  async unlock(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return false;
      const ctx = new Ctx();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 3;
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp).connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      this.white = noiseBuffer(ctx, false);
      this.pink = noiseBuffer(ctx, true);
    }
    if (this.ctx.state !== "running") {
      try {
        await this.ctx.resume();
      } catch {
        /* not allowed yet */
      }
    }
    return this.ready;
  }

  /** Stop whatever is playing, with a click-free fade of `fade` seconds. */
  stop(fade = 0.05) {
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
    window.setTimeout(() => run.gain.disconnect(), (fade + 0.3) * 1000);
  }

  /** With the film's hard cut: the wind stops dead. */
  cut() {
    this.stop(0.04);
  }

  /**
   * Wind gathering speed over `duration` seconds. `from` skips the part that
   * has already passed (sound allowed only after the film started).
   */
  rise(duration: number, from = 0) {
    const run = this.begin();
    if (!run) return;
    const T = Math.max(0.5, duration);
    const k0 = Math.min(0.95, Math.max(0, from / T));
    this.wind(run, T - from, k0, 1);
  }

  /** The wind falling away over `duration` seconds. */
  rewind(duration: number) {
    const run = this.begin();
    if (!run) return;
    this.wind(run, Math.max(0.4, duration), 1, 0);
  }

  /* ------------------------------------------------------------------ */

  /**
   * Wind moving from intensity k0 to k1 (0 = a breath, 1 = full speed) over
   * `dur` seconds: a broad body of pink noise (two layers, left and right),
   * a thinner airflow band above it, and gusts whose rate follows the speed.
   */
  private wind(run: Run, dur: number, k0: number, k1: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const end = now + dur;
    const exp = (a: number, b: number, k: number) => a * (b / a) ** k;
    const set = (p: AudioParam, a: number, b: number, curve: "exp" | "lin" = "exp") => {
      p.setValueAtTime(a, now);
      if (curve === "exp") p.exponentialRampToValueAtTime(b, end);
      else p.linearRampToValueAtTime(b, end);
    };

    // Gusts: one LFO shared by every layer, its rate rising with the speed.
    const gust = ctx.createOscillator();
    gust.type = "sine";
    set(gust.frequency, exp(GUST_SLOW, GUST_FAST, k0), exp(GUST_SLOW, GUST_FAST, k1));
    const gustDepth = ctx.createGain();
    gustDepth.gain.value = 0.32;
    gust.connect(gustDepth);
    gust.start(now);
    run.sources.push(gust);

    const layer = (opts: {
      buffer: AudioBuffer;
      type: BiquadFilterType;
      q: number;
      freq: [number, number];
      level: [number, number];
      pan: number;
      offset: number;
    }) => {
      const src = ctx.createBufferSource();
      src.buffer = opts.buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = opts.type;
      filter.Q.value = opts.q;
      set(filter.frequency, exp(opts.freq[0], opts.freq[1], k0), exp(opts.freq[0], opts.freq[1], k1));
      const level = ctx.createGain();
      // A short fade-in so the wind never starts with a click.
      level.gain.setValueAtTime(0.0001, now);
      level.gain.linearRampToValueAtTime(exp(opts.level[0], opts.level[1], k0), now + 0.12);
      level.gain.exponentialRampToValueAtTime(exp(opts.level[0], opts.level[1], k1), end);
      const gusting = ctx.createGain();
      gusting.gain.value = 1;
      gustDepth.connect(gusting.gain);
      const pan = ctx.createStereoPanner();
      pan.pan.value = opts.pan;
      src.connect(filter).connect(level).connect(gusting).connect(pan).connect(run.gain);
      src.start(now, opts.offset);
      run.sources.push(src);
    };

    // Body, left and right (different stretches of the noise, so it feels wide).
    layer({ buffer: this.pink!, type: "lowpass", q: 0.6, freq: [260, 2600], level: [0.07, 0.65], pan: -0.55, offset: 0 });
    layer({ buffer: this.pink!, type: "lowpass", q: 0.6, freq: [240, 2400], level: [0.07, 0.65], pan: 0.55, offset: 0.9 });
    // Airflow: a narrower band that climbs into a high rush.
    layer({ buffer: this.white!, type: "bandpass", q: 2.8, freq: [520, 4600], level: [0.012, 0.26], pan: 0, offset: 0.4 });
  }

  /** A fresh output for one sound; it replaces the previous one. */
  private begin(): Run | null {
    if (!this.ready || !this.ctx || !this.master) return null;
    this.stop();
    const gain = this.ctx.createGain();
    gain.connect(this.master);
    const run: Run = { gain, sources: [] };
    this.run = run;
    return run;
  }
}

/** Two seconds of white or pink noise (pink: Paul Kellet's filter — softer, more like air). */
function noiseBuffer(ctx: AudioContext, pink: boolean) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    if (!pink) {
      data[i] = w;
      continue;
    }
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buffer;
}

/** One shared engine for the page. */
export const introSound = new IntroSound();
