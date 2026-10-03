"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import stageStyles from "@/components/brand/BrandStage.module.css";
import type { StageMotion, StagePoseDeg } from "@/lib/data/stages";
import type { Brand, BrandStageDef } from "@/lib/data/types";
import type { gsap } from "@/lib/gsap";
import { buildStageTimeline, createStageState } from "@/lib/scene/stage";
import { putJson } from "./api";
import { useStatus } from "./useStatus";
import styles from "./StageEditor.module.css";

const ShowcaseWatchScene = dynamic(() => import("@/components/three/ShowcaseWatchScene"), { ssr: false });

type PoseKey = keyof StageMotion["poses"];
type StepKey = "logo" | "bracelet" | "exit";

const POSES: { key: PoseKey; label: string; hint: string }[] = [
  { key: "intro", label: "Açılış", hint: "Sayfa açıldığında, logonun altında" },
  { key: "logo", label: "Yazı", hint: "Kadrandaki marka yazısına yakın plan" },
  { key: "bracelet", label: "Kordon", hint: "Bilezik yakın planı" },
  { key: "exit", label: "Çıkış", hint: "Ürünler gelirken uzaklaştığı yer" },
];

const AXES: { key: keyof StagePoseDeg; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: "x", label: "Sağ — sol", min: -3, max: 3, step: 0.01 },
  { key: "y", label: "Yukarı — aşağı", min: -3, max: 3, step: 0.01 },
  { key: "z", label: "Uzaklık (küçük = yakın)", min: -12, max: -0.3, step: 0.01 },
  { key: "yaw", label: "Dönüş (sağa-sola)", min: -720, max: 360, step: 1, unit: "°" },
  { key: "pitch", label: "Eğim (öne-arkaya)", min: -180, max: 180, step: 1, unit: "°" },
  { key: "roll", label: "Yatış (kendi ekseninde)", min: -180, max: 180, step: 1, unit: "°" },
];

const STEPS: { key: StepKey; label: string }[] = [
  { key: "logo", label: "Yazıya dönüş" },
  { key: "bracelet", label: "Kordona dönüş" },
  { key: "exit", label: "Çıkış" },
];

/** When each pose is fully reached on the timeline (where the preview jumps to). */
const poseTime = (m: StageMotion, k: PoseKey) =>
  k === "intro" ? 0 : m.times[k].at + m.times[k].dur;

const endOf = (m: StageMotion) => Math.max(m.times.end, m.times.exit.at + m.times.exit.dur);

/**
 * Turn editor for a brand's 3D opening. Everything is previewed live with the
 * real timeline and the real page layout (title and lines); "Kaydedin" writes
 * lib/data/stages.json, and the page picks it up on its next load.
 */
export function StageEditor({ brand, stage, initial }: { brand: Brand; stage: BrandStageDef; initial: StageMotion }) {
  const [motion, setMotion] = useState<StageMotion>(initial);
  const [saved, setSaved] = useState<StageMotion>(initial);
  const [pose, setPose] = useState<PoseKey>("intro");
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const status = useStatus();

  const state = useMemo(() => createStageState(initial), [initial]);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const wake = useRef<() => void>(() => {});
  const frame = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const timeRef = useRef(time);
  timeRef.current = time;
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const motionRef = useRef(motion);
  motionRef.current = motion;

  const end = endOf(motion);
  const dirty = JSON.stringify(motion) !== JSON.stringify(saved);

  // Rebuild the real timeline whenever the motion changes, and hold it where the preview is.
  useEffect(() => {
    tl.current?.kill();
    Object.assign(state, createStageState(motion));
    const t = buildStageTimeline(state, motion, { title: title.current, lines: lines.current });
    t.pause();
    t.eventCallback("onUpdate", () => {
      frame.current?.style.setProperty("--show", state.show.toFixed(3));
      wake.current();
    });
    t.seek(Math.min(timeRef.current, t.duration()), false);
    frame.current?.style.setProperty("--show", state.show.toFixed(3));
    wake.current();
    tl.current = t;
    return () => {
      t.kill();
    };
  }, [motion, state]);

  // Scrubbing the preview.
  const seek = useCallback((t: number) => {
    setTime(t);
    tl.current?.seek(t, false);
    wake.current();
  }, []);

  // Play the whole timeline, at the speed it has on the page with a steady scroll.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const t = Math.min(end, timeRef.current + (now - last) / 1000);
      last = now;
      seek(t);
      if (t >= end) setPlaying(false);
      else raf = requestAnimationFrame(step);
    };
    if (timeRef.current >= end - 0.01) seek(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, end, seek]);

  const onWake = useCallback((fn: () => void) => {
    wake.current = fn;
    fn();
  }, []);

  const choosePose = (k: PoseKey) => {
    setPlaying(false);
    setPose(k);
    seek(poseTime(motion, k));
  };

  /** Change the pose being edited, and keep the preview on it. */
  const editPose = (fn: (p: StagePoseDeg) => StagePoseDeg) => {
    setPlaying(false);
    setMotion((m) => ({ ...m, poses: { ...m.poses, [pose]: fn(m.poses[pose]) } }));
    setTime(poseTime(motion, pose));
  };
  const setAxis = (k: keyof StagePoseDeg, v: number) => {
    if (!Number.isFinite(v)) return;
    editPose((p) => ({ ...p, [k]: v }));
  };

  /* -------------------------------------------------- mouse on the preview */
  const drag = useRef<{ x: number; y: number; mode: "turn" | "move" | "roll" } | null>(null);
  const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const mode = e.button === 2 || e.shiftKey ? "move" : e.altKey ? "roll" : "turn";
    drag.current = { x: e.clientX, y: e.clientY, mode };
    e.currentTarget.dataset.mode = mode;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    const fine = e.ctrlKey || e.metaKey ? 0.25 : 1;
    if (d.mode === "turn") {
      editPose((p) => ({ ...p, yaw: round(p.yaw + dx * 0.45 * fine, 1), pitch: round(p.pitch + dy * 0.45 * fine, 1) }));
    } else if (d.mode === "roll") {
      editPose((p) => ({ ...p, roll: round(p.roll + dx * 0.45 * fine, 1) }));
    } else {
      // Move with the pointer: one pixel is this much of the scene at the watch's distance.
      const h = frame.current?.clientHeight ?? 600;
      editPose((p) => {
        const perPx = (2 * Math.abs(p.z) * Math.tan((30 * Math.PI) / 360)) / h;
        return { ...p, x: round(p.x + dx * perPx * fine, 3), y: round(p.y - dy * perPx * fine, 3) };
      });
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    delete e.currentTarget.dataset.mode;
  };
  // The wheel brings the watch closer or sends it further away.
  useEffect(() => {
    const el = frame.current?.querySelector<HTMLElement>("[data-drag]");
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const k = Math.exp(e.deltaY * 0.0012 * (e.ctrlKey || e.metaKey ? 0.25 : 1));
      setPlaying(false);
      setMotion((m) => {
        const p = m.poses[poseRef.current];
        const z = Math.min(-0.3, Math.max(-30, round(p.z * k, 3)));
        return { ...m, poses: { ...m.poses, [poseRef.current]: { ...p, z } } };
      });
      setTime(poseTime(motionRef.current, poseRef.current));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  const setStep = (k: StepKey, field: "at" | "dur", v: number) =>
    Number.isFinite(v) && setMotion((m) => ({ ...m, times: { ...m.times, [k]: { ...m.times[k], [field]: Math.max(0, v) } } }));

  const save = async () => {
    try {
      await putJson("/api/yonetim/donusler", { slug: brand.slug, motion });
      setSaved(motion);
      status.show("Kaydedildi. Sayfayı yenileyince yeni dönüşler görünür.");
    } catch (e) {
      status.show((e as Error).message, true);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(motion, null, 2));
    status.show("Değerler panoya kopyalandı.");
  };

  const current = motion.poses[pose];
  const scrollScreens = (end * motion.speed) / 100;

  return (
    <div className={styles.editor}>
      {/* ---------------------------------------------------------- preview */}
      <div className={styles.previewCol}>
        <div className={styles.previewBar}>
          <div className={styles.segment}>
            <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
              Masaüstü
            </button>
            <button type="button" aria-pressed={device === "phone"} onClick={() => setDevice("phone")}>
              Telefon
            </button>
          </div>
          <a href={`/markalar/${brand.slug}`} target="_blank" rel="noreferrer" className={styles.link}>
            Sayfada görün ↗
          </a>
        </div>

        <div ref={frame} className={styles.frame} data-device={device}>
          <div className={stageStyles.light} />
          <div className={stageStyles.canvas}>
            <ShowcaseWatchScene
              state={state}
              model={stage.model}
              pivot={stage.pivot}
              active
              onWake={onWake}
              tone="steel"
              portrait={{ lift: 0.32, pull: 2.2 }}
            />
          </div>
          {/* The page's own title and lines, so their room around the watch can be judged. */}
          <div ref={title} className={`${stageStyles.title} ${styles.previewTitle}`}>
            <p className={stageStyles.eyebrow}>{stage.eyebrow}</p>
            <div className={stageStyles.logo}>
              <Image src={brand.logo} alt="" fill sizes="400px" />
            </div>
          </div>
          {stage.lines.map((l, i) => {
            const [before, after] = l.title.split(l.accent);
            return (
              <div key={l.title} ref={(n) => void (lines.current[i] = n)} className={`${stageStyles.line} ${styles.previewLine}`} data-side={l.side}>
                <p className={stageStyles.index}>{String(i + 1).padStart(2, "0")}</p>
                <h2 className={stageStyles.lineTitle}>
                  {before}
                  <em>{l.accent}</em>
                  {after}
                </h2>
                <p className={stageStyles.lineText}>{l.text}</p>
              </div>
            );
          })}
          {/* Mouse control of the pose being edited. */}
          <div
            data-drag
            data-lenis-prevent
            className={styles.drag}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span className={styles.dragPose}>Düzenlenen: {POSES.find((p) => p.key === pose)?.label}</span>
            <span className={styles.dragHelp}>
              Sürükle: döndür · Sağ tık veya Shift + sürükle: taşı · Tekerlek: yaklaş / uzaklaş · Alt + sürükle: yatır · Ctrl:
              hassas
            </span>
          </div>
        </div>

        <div className={styles.scrub}>
          <button type="button" className={styles.play} onClick={() => setPlaying((p) => !p)}>
            {playing ? "Durdur" : "Oynat"}
          </button>
          <input
            type="range"
            min={0}
            max={end}
            step={0.01}
            value={Math.min(time, end)}
            onChange={(e) => {
              setPlaying(false);
              seek(Number(e.target.value));
            }}
            aria-label="Zaman"
          />
          <span className={styles.time}>
            {time.toFixed(1)} / {end.toFixed(1)} sn
          </span>
        </div>
        <p className={styles.note}>
          Kaydırıcı, sayfayı aşağı kaydırmak gibidir. Tüm hareket sayfada yaklaşık {scrollScreens.toFixed(1)} ekran boyu kaydırmaya
          yayılır.
        </p>
      </div>

      {/* ---------------------------------------------------------- controls */}
      <div className={styles.controls}>
        <section className={styles.block}>
          <h2 className={styles.blockTitle}>1 · Duruş seçin</h2>
          <div className={styles.tabs}>
            {POSES.map((p) => (
              <button key={p.key} type="button" aria-pressed={pose === p.key} onClick={() => choosePose(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>{POSES.find((p) => p.key === pose)?.hint}. Önizleme bu duruşu gösteriyor.</p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>2 · Saati yerleştirin</h2>
          {AXES.map((a) => (
            <label key={a.key} className={styles.axis}>
              <span className={styles.axisLabel}>{a.label}</span>
              <input
                type="range"
                min={a.min}
                max={a.max}
                step={a.step}
                value={current[a.key]}
                onChange={(e) => setAxis(a.key, Number(e.target.value))}
              />
              <span className={styles.number}>
                <input
                  type="number"
                  step={a.step}
                  value={current[a.key]}
                  onChange={(e) => setAxis(a.key, Number(e.target.value))}
                />
                {a.unit}
              </span>
            </label>
          ))}
          <p className={styles.hint}>
            Dönüş açıları birikir: bir sonraki duruş aynı yönde devam etsin diye −360° gibi değerler normaldir.
          </p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>3 · Zamanlama ve hız</h2>
          <div className={styles.grid}>
            <span />
            <span className={styles.colHead}>Başlangıç (sn)</span>
            <span className={styles.colHead}>Süre (sn)</span>
            {STEPS.map((s) => (
              <FragmentRow key={s.key} label={s.label}>
                <input type="number" step={0.1} min={0} value={motion.times[s.key].at} onChange={(e) => setStep(s.key, "at", Number(e.target.value))} />
                <input type="number" step={0.1} min={0.1} value={motion.times[s.key].dur} onChange={(e) => setStep(s.key, "dur", Number(e.target.value))} />
              </FragmentRow>
            ))}
          </div>
          <label className={styles.axis}>
            <span className={styles.axisLabel}>Yazıya giderken tam tur</span>
            <input type="range" min={0} max={3} step={1} value={motion.spins.logo} onChange={(e) => setMotion((m) => ({ ...m, spins: { ...m.spins, logo: Number(e.target.value) } }))} />
            <span className={styles.number}>{motion.spins.logo}</span>
          </label>
          <label className={styles.axis}>
            <span className={styles.axisLabel}>Kordona giderken tam tur</span>
            <input type="range" min={0} max={3} step={1} value={motion.spins.bracelet} onChange={(e) => setMotion((m) => ({ ...m, spins: { ...m.spins, bracelet: Number(e.target.value) } }))} />
            <span className={styles.number}>{motion.spins.bracelet}</span>
          </label>
          <label className={styles.axis}>
            <span className={styles.axisLabel}>Kaydırma uzunluğu (büyük = daha yavaş)</span>
            <input type="range" min={20} max={200} step={1} value={motion.speed} onChange={(e) => setMotion((m) => ({ ...m, speed: Number(e.target.value) }))} />
            <span className={styles.number}>{motion.speed}</span>
          </label>
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.save} onClick={save} disabled={!dirty}>
            {dirty ? "Kaydedin" : "Kaydedildi"}
          </button>
          <button type="button" className={styles.secondary} onClick={() => setMotion(saved)} disabled={!dirty}>
            Geri al
          </button>
          <button type="button" className={styles.secondary} onClick={copy}>
            Kopyala
          </button>
        </div>
      </div>
      {status.node}
    </div>
  );
}

function FragmentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className={styles.rowLabel}>{label}</span>
      {children}
    </>
  );
}
