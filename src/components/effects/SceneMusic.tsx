"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SceneMusic.module.css";

const KEY = "furkan-saat:music-off";
const VOLUME = 0.55;

/**
 * Music for a page, looping without a seam: decoded with Web Audio and looped
 * sample-exactly (an <audio loop> leaves a gap). The file is built so its end
 * runs into its start; the encoder's silent padding at either end is trimmed.
 * Browsers only allow sound after a click, tap or key press, so it starts on
 * the first one; a small button turns it off and on (remembered).
 */
export function SceneMusic({ src, label = "Müzik" }: { src: { m4a: string; mp3: string }; label?: string }) {
  const [on, setOn] = useState(false);
  const want = useRef(true);
  const button = useRef<HTMLButtonElement>(null);
  const controls = useRef<{ play: () => Promise<void>; mute: () => void } | null>(null);

  useEffect(() => {
    try {
      want.current = localStorage.getItem(KEY) !== "1";
    } catch {}
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const a = { buffer: null as AudioBuffer | null, source: null as AudioBufferSourceNode | null };

    const file = new Audio().canPlayType("audio/mp4") ? src.m4a : src.mp3;
    const loading = fetch(file)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b))
      .then((buf) => (a.buffer = buf))
      .catch(() => null);

    const begin = async () => {
      await loading;
      if (!a.buffer || a.source) return;
      const s = ctx.createBufferSource();
      s.buffer = a.buffer;
      s.loop = true;
      // Skip the encoder's silent padding at the ends, so the loop meets itself exactly.
      const d = a.buffer.getChannelData(0);
      let i = 0;
      while (i < d.length && Math.abs(d[i]) < 2e-4) i++;
      let j = d.length - 1;
      while (j > i && Math.abs(d[j]) < 2e-4) j--;
      s.loopStart = i / a.buffer.sampleRate;
      s.loopEnd = (j + 1) / a.buffer.sampleRate;
      s.connect(gain);
      s.start(0, s.loopStart);
      a.source = s;
    };
    const fade = (to: number, secs: number) => {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(to, t + secs);
    };
    const play = async () => {
      await ctx.resume().catch(() => {});
      await begin();
      fade(VOLUME, 2.2);
      setOn(true);
    };

    // The first click, tap or key press anywhere starts it (unless turned off before).
    const gesture = (e: Event) => {
      // The button itself decides on its own click.
      if (button.current?.contains(e.target as Node)) return;
      remove();
      if (want.current) void play();
    };
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const remove = () => events.forEach((t) => window.removeEventListener(t, gesture, true));
    events.forEach((t) => window.addEventListener(t, gesture, { capture: true, passive: true }));

    const onHidden = () => {
      if (document.hidden) void ctx.suspend();
      else if (want.current && a.source) void ctx.resume();
    };
    document.addEventListener("visibilitychange", onHidden);

    controls.current = {
      play,
      mute: () => {
        remove();
        fade(0, 0.8);
      },
    };
    return () => {
      remove();
      document.removeEventListener("visibilitychange", onHidden);
      // Leaving the page: a short fade, then silence.
      fade(0, 0.6);
      window.setTimeout(() => void ctx.close().catch(() => {}), 700);
      controls.current = null;
    };
  }, [src.m4a, src.mp3]);

  const toggle = () => {
    const a = controls.current;
    if (!a) return;
    const next = !on;
    want.current = next;
    try {
      localStorage.setItem(KEY, next ? "0" : "1");
    } catch {}
    if (next) void a.play();
    else {
      a.mute();
      setOn(false);
    }
  };

  return (
    <button
      ref={button}
      type="button"
      className={styles.toggle}
      data-on={on || undefined}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? `${label}: kapat` : `${label}: aç`}
    >
      <span className={styles.bars} aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={styles.text}>{on ? "Ses açık" : "Ses kapalı"}</span>
    </button>
  );
}
