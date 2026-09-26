"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FrameSequence } from "@/components/sections/hero/FrameSequence";
import { ASSETS } from "@/lib/assets";
import { createHeroState } from "@/lib/scene/hero";
import { progress } from "@/lib/scene/progress";
import { SEAT_DEFAULTS, SEAT_FIELDS, type SeatConfig } from "@/lib/scene/seat";
import styles from "./SeatControl.module.css";

const HeroWatchScene = dynamic(() => import("@/components/three/hero/HeroWatchScene"), { ssr: false });

const { dir, count, ext } = ASSETS.hero.frames;
const frameSrc = (i: number) => `${dir}/${String(i).padStart(3, "0")}.${ext}`;
const DRAFT_KEY = "furkan-saat:seat-draft";

type Key = keyof SeatConfig;
const field = (k: Key) => SEAT_FIELDS.find((f) => f.key === k)!;
const clampTo = (k: Key, v: number) => {
  const f = field(k);
  return Math.min(f.max, Math.max(f.min, Math.round(v / f.step) * f.step));
};

/** Keyboard map: key → [field, direction]. Shift = 10× step. */
const KEYS: Record<string, [Key, 1 | -1]> = {
  ArrowLeft: ["offsetX", -1],
  ArrowRight: ["offsetX", 1],
  ArrowUp: ["offsetZ", -1],
  ArrowDown: ["offsetZ", 1],
  PageUp: ["offsetY", 1],
  PageDown: ["offsetY", -1],
  q: ["yaw", -1],
  e: ["yaw", 1],
  w: ["tilt", -1],
  s: ["tilt", 1],
  a: ["roll", -1],
  d: ["roll", 1],
  "+": ["scale", 1],
  "=": ["scale", 1],
  "-": ["scale", -1],
};

/**
 * SEAT CONTROL — /kontrol
 * Live preview of the opening's first frames with the 3D watch on the cushion.
 * Every value from seat.json has a slider, a number field and −/+ buttons;
 * the main ones also have keyboard shortcuts. "Kaydet" writes seat.json
 * (development only); "Kopyala" copies the JSON for pasting by hand.
 */
export function SeatControl() {
  const [seat, setSeat] = useState<SeatConfig>(SEAT_DEFAULTS);
  const [frame, setFrame] = useState(0);
  const [debug, setDebug] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const film = useRef<HTMLCanvasElement>(null);
  const seq = useRef<FrameSequence | null>(null);
  const state = useMemo(createHeroState, []);

  // Restore an unsaved draft from this browser, if any.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<SeatConfig>;
      const merged = { ...SEAT_DEFAULTS, ...draft };
      if (JSON.stringify(merged) !== JSON.stringify(SEAT_DEFAULTS)) {
        setSeat(merged);
        setStatus({ tone: "info", text: "Kaydedilmemiş taslak geri yüklendi." });
      }
    } catch {
      /* storage unavailable — start from the file values */
    }
  }, []);

  // Keep the draft in this browser while tuning.
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(seat));
    } catch {
      /* ignore */
    }
    progress.intro.wake?.();
  }, [seat]);

  // Footage frames.
  useEffect(() => {
    if (!film.current) return;
    const s = new FrameSequence(film.current, frameSrc, count);
    seq.current = s;
    const onResize = () => s.resize();
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      s.dispose();
    };
  }, []);

  useEffect(() => {
    state.frame = frame;
    seq.current?.draw(frame, true);
    progress.intro.wake?.();
  }, [frame, state]);

  // "Oynat": ping-pong through the footage to check the tracking.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let dirn = 1;
    let f = frame;
    const tick = () => {
      f += dirn * 0.5;
      if (f >= count - 1 || f <= 0) dirn *= -1;
      f = Math.max(0, Math.min(count - 1, f));
      setFrame(Math.round(f * 2) / 2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const update = useCallback((k: Key, v: number) => setSeat((s) => ({ ...s, [k]: clampTo(k, v) })), []);
  const nudge = useCallback(
    (k: Key, dirn: number, big = false) => setSeat((s) => ({ ...s, [k]: clampTo(k, s[k] + dirn * field(k).step * (big ? 10 : 1)) })),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Leave typing fields and sliders alone (they use the arrow keys themselves).
      const t = e.target as HTMLInputElement;
      if (t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && ["number", "text", "range"].includes(t.type))) return;
      const map = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!map) return;
      e.preventDefault();
      nudge(map[0], map[1], e.shiftKey);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nudge]);

  const save = async () => {
    setStatus({ tone: "info", text: "Kaydediliyor…" });
    try {
      const res = await fetch("/api/seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seat),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi.");
      setStatus({ tone: "ok", text: "Kaydedildi: src/lib/scene/seat.json güncellendi." });
    } catch (err) {
      setStatus({ tone: "error", text: (err as Error).message });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(seat, null, 2));
      setStatus({ tone: "ok", text: "Değerler panoya kopyalandı." });
    } catch {
      setStatus({ tone: "error", text: "Panoya kopyalanamadı — değerleri aşağıdaki kutudan kopyalayın." });
    }
  };

  const reset = () => {
    setSeat(SEAT_DEFAULTS);
    setStatus({ tone: "info", text: "Dosyadaki kayıtlı değerlere dönüldü." });
  };

  const groups = Array.from(new Set(SEAT_FIELDS.map((f) => f.group)));

  return (
    <main className={styles.page}>
      <section className={styles.stage} aria-label="Önizleme">
        <div className={styles.frame}>
          <canvas ref={film} className={styles.film} aria-hidden />
          <HeroWatchScene state={state} seat={seat} debug={debug} className={styles.canvas} />
        </div>

        <div className={styles.timeline}>
          <button className={styles.button} onClick={() => setPlaying((p) => !p)}>
            {playing ? "Durdur" : "Oynat"}
          </button>
          <label className={styles.frameLabel}>
            Video karesi
            <input
              type="range"
              min={0}
              max={count - 1}
              step={1}
              value={frame}
              onChange={(e) => setFrame(Number(e.target.value))}
            />
            <span className={styles.value}>{Math.round(frame)}</span>
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
            Gizli şekilleri göster
          </label>
        </div>

        <details className={styles.help}>
          <summary>Klavye kısayolları</summary>
          <ul>
            <li>← → sağa / sola · ↑ ↓ ileri / geri · Page Up / Down yukarı / aşağı</li>
            <li>Q / E kendi etrafında · W / S öne / arkaya eğim · A / D yana yatma</li>
            <li>+ / − boyut · Shift ile 10 kat büyük adım</li>
          </ul>
        </details>
      </section>

      <aside className={styles.panel} aria-label="Ayarlar">
        <header className={styles.panelHead}>
          <p className="t-eyebrow">Kontrol</p>
          <h1 className={styles.title}>Saat konumu</h1>
          <p className={styles.note}>
            Değişiklikler anında önizlemede görünür. <strong>Kaydet</strong> yalnızca bilgisayarınızda{" "}
            <code>npm run dev</code> ile çalışırken dosyayı günceller.
          </p>
        </header>

        {groups.map((g) => (
          <fieldset key={g} className={styles.group}>
            <legend>{g}</legend>
            {SEAT_FIELDS.filter((f) => f.group === g).map((f) => (
              <div key={f.key} className={styles.row}>
                <label htmlFor={`f-${f.key}`}>{f.label}</label>
                <div className={styles.controls}>
                  <button className={styles.step} onClick={() => nudge(f.key, -1)} aria-label={`${f.label} azalt`}>
                    −
                  </button>
                  <input
                    id={`f-${f.key}`}
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={seat[f.key]}
                    onChange={(e) => update(f.key, Number(e.target.value))}
                  />
                  <button className={styles.step} onClick={() => nudge(f.key, 1)} aria-label={`${f.label} artır`}>
                    +
                  </button>
                  <input
                    className={styles.number}
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={Number(seat[f.key].toFixed(4))}
                    onChange={(e) => e.target.value !== "" && update(f.key, Number(e.target.value))}
                    aria-label={`${f.label} değeri`}
                  />
                </div>
              </div>
            ))}
          </fieldset>
        ))}

        <div className={styles.actions}>
          <button className={`${styles.button} ${styles.primary}`} onClick={save}>
            Kaydet
          </button>
          <button className={styles.button} onClick={copy}>
            Kopyala
          </button>
          <button className={styles.button} onClick={reset}>
            Sıfırla
          </button>
        </div>
        {status && (
          <p className={styles.status} data-tone={status.tone} role="status">
            {status.text}
          </p>
        )}
        <textarea className={styles.json} readOnly value={JSON.stringify(seat, null, 2)} aria-label="Değerler (JSON)" />
      </aside>
    </main>
  );
}
