"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import stageStyles from "@/components/brand/BrandStage.module.css";
import type { StageMotion, StageScene } from "@/lib/data/stages";
import type { Brand, BrandStageDef } from "@/lib/data/types";
import {
  applyOverlay,
  blankScene,
  createStageState,
  degFromQuat,
  quatFromDeg,
  sampleStage,
  sceneTimes,
  turnOnScreen,
} from "@/lib/scene/stage";
import { putJson } from "./api";
import { useStatus } from "./useStatus";
import styles from "./StageEditor.module.css";

const ShowcaseWatchScene = dynamic(() => import("@/components/three/ShowcaseWatchScene"), { ssr: false });

/** A scene in the editor carries a local id, so it can be tracked while scenes move around. */
type Scene = StageScene & { id: number };
type Draft = { speed: number; scenes: Scene[] };

let nextId = 1;
const withIds = (m: StageMotion): Draft => ({ speed: m.speed, scenes: m.scenes.map((s) => ({ ...s, id: nextId++ })) });
const strip = (d: Draft): StageMotion => ({ speed: d.speed, scenes: d.scenes.map(({ id: _id, ...s }) => s as StageScene) });
const plain = ({ id: _id, ...s }: Scene) => JSON.stringify(s);
const same = (a?: Scene, b?: Scene) => !!a && !!b && plain(a) === plain(b);
const draftKey = (slug: string) => `furkan-saat:sahne-taslak:${slug}`;
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * Scene-by-scene editor for a brand's 3D opening.
 *  - Pick a scene, place the watch with the mouse (any angle) or the controls,
 *    set how it turns into that scene, and "Sahneyi kaydet" — kept in this
 *    browser as a draft, so nothing is lost on reload.
 *  - Add scenes in between for more turns, reorder or remove them.
 *  - "Tümünü kaydet" writes every scene to lib/data/stages.json; the page
 *    uses it from its next load.
 */
export function StageEditor({ brand, stage, initial }: { brand: Brand; stage: BrandStageDef; initial: StageMotion }) {
  const status = useStatus();
  const [file, setFile] = useState<Draft>(() => withIds(initial));
  const [work, setWork] = useState<Draft>(file);
  const [kept, setKept] = useState<Draft>(file);
  const [fromDraft, setFromDraft] = useState(false);
  const [sel, setSel] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState<null | { to: number }>(null);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");

  // A draft of scenes saved one by one in an earlier visit.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(brand.slug));
      if (!raw) return;
      const d = withIds(JSON.parse(raw) as StageMotion);
      if (JSON.stringify(strip(d)) === JSON.stringify(initial)) return;
      setWork(d);
      setKept(d);
      setFromDraft(true);
    } catch {
      /* no draft */
    }
  }, [brand.slug, initial]);

  const motion = useMemo(() => strip(work), [work]);
  const { times, total } = useMemo(() => sceneTimes(motion), [motion]);
  const scene = work.scenes[Math.min(sel, work.scenes.length - 1)];
  const keptScene = kept.scenes.find((s) => s.id === scene.id);
  const unsaved = (s: Scene) => !same(s, kept.scenes.find((k) => k.id === s.id));
  const unsavedCount = work.scenes.filter(unsaved).length;
  const fileDirty = JSON.stringify(motion) !== JSON.stringify(strip(file));

  /* ------------------------------------------------------------ preview */
  const state = useMemo(() => createStageState(initial), [initial]);
  const wake = useRef<() => void>(() => {});
  const frame = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const refs = useRef({ motion, time, sel, work });
  refs.current = { motion, time, sel, work };

  const draw = useCallback(() => {
    const { motion: m, time: t } = refs.current;
    const o = sampleStage(m, t, state, stage.lines.length);
    applyOverlay(o, title.current, lines.current, stage.lines.map((l) => l.side));
    frame.current?.style.setProperty("--show", state.show.toFixed(3));
    wake.current();
  }, [state, stage.lines]);
  useEffect(draw, [motion, time, draw]);

  const onWake = useCallback(
    (fn: () => void) => {
      wake.current = fn;
      draw();
    },
    [draw],
  );

  // Play (a scene, or everything): one timeline second per second.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const t = Math.min(playing.to, refs.current.time + (now - last) / 1000);
      last = now;
      setTime(t);
      if (t >= playing.to) setPlaying(null);
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const select = (i: number) => {
    setPlaying(null);
    setSel(i);
    setTime(sceneTimes(refs.current.motion).times[i]?.arrive ?? 0);
  };

  /* ------------------------------------------------------------ editing */
  const edit = (fn: (s: Scene) => Scene) => {
    setPlaying(null);
    setWork((w) => ({ ...w, scenes: w.scenes.map((s, i) => (i === refs.current.sel ? fn(s) : s)) }));
  };
  // While a pose is being set, the preview shows the scene as reached.
  const editPose = (fn: (s: Scene) => Scene) => {
    edit(fn);
    setTime(times[sel]?.arrive ?? 0);
  };

  const persistDraft = (d: Draft) => {
    try {
      localStorage.setItem(draftKey(brand.slug), JSON.stringify(strip(d)));
    } catch {
      /* storage blocked */
    }
  };

  const saveScene = () => {
    const at = kept.scenes.findIndex((s) => s.id === scene.id);
    const order = work.scenes.map((s) => s.id);
    // Keep the saved list in the working order, with this scene's new version.
    const next = { speed: kept.speed, scenes: order.flatMap((id) => (id === scene.id ? [scene] : kept.scenes.filter((s) => s.id === id))) };
    setKept(next);
    persistDraft(next);
    status.show(at < 0 ? `"${scene.name}" eklendi ve kaydedildi.` : `"${scene.name}" kaydedildi.`);
  };
  const revertScene = () => keptScene && edit(() => ({ ...keptScene }));

  const addAfter = () => {
    const i = sel;
    const from = work.scenes[i];
    const fresh: Scene = { ...blankScene(from, work.scenes.filter((s) => s.name.startsWith("Ara sahne")).length + 1), id: nextId++ };
    const scenes = [...work.scenes.slice(0, i + 1), fresh, ...work.scenes.slice(i + 1)];
    setWork({ ...work, scenes });
    setSel(i + 1);
    setTime(sceneTimes(strip({ ...work, scenes })).times[i + 1].arrive);
  };
  const remove = () => {
    if (work.scenes.length <= 2) return status.show("En az iki sahne kalmalı.", true);
    if (!window.confirm(`"${scene.name}" silinsin mi?`)) return;
    const scenes = work.scenes.filter((s) => s.id !== scene.id);
    setWork({ ...work, scenes });
    const k = { ...kept, scenes: kept.scenes.filter((s) => s.id !== scene.id) };
    setKept(k);
    persistDraft(k);
    setSel(Math.max(0, sel - 1));
  };
  const move = (d: -1 | 1) => {
    const j = sel + d;
    if (j < 0 || j >= work.scenes.length) return;
    const scenes = [...work.scenes];
    [scenes[sel], scenes[j]] = [scenes[j], scenes[sel]];
    setWork({ ...work, scenes });
    const order = scenes.map((s) => s.id);
    const k = { ...kept, scenes: order.flatMap((id) => kept.scenes.filter((s) => s.id === id)) };
    setKept(k);
    persistDraft(k);
    setSel(j);
  };

  const saveAll = async () => {
    if (unsavedCount > 0 && !window.confirm(`${unsavedCount} sahnede kaydedilmemiş değişiklik var. Onlar da yazılsın mı?`)) return;
    try {
      await putJson("/api/yonetim/donusler", { slug: brand.slug, motion });
      setFile(work);
      setKept(work);
      setFromDraft(false);
      try {
        localStorage.removeItem(draftKey(brand.slug));
      } catch {
        /* ignore */
      }
      status.show("Tümü kaydedildi. Marka sayfasını yenileyince yeni dönüşler görünür.");
    } catch (e) {
      status.show((e as Error).message, true);
    }
  };
  const backToFile = () => {
    if (!window.confirm("Taslak silinsin ve dosyadaki ayarlara dönülsün mü?")) return;
    setWork(file);
    setKept(file);
    setFromDraft(false);
    setSel(0);
    setTime(0);
    try {
      localStorage.removeItem(draftKey(brand.slug));
    } catch {
      /* ignore */
    }
  };

  /* ------------------------------------------------- mouse on the preview */
  const drag = useRef<{ x: number; y: number; mode: "turn" | "move" | "roll" } | null>(null);
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
      // Like turning a ball under your hand: about the screen's axes, at any angle.
      editPose((s) => ({ ...s, q: turnOnScreen(turnOnScreen(s.q, "y", dx * 0.45 * fine), "x", dy * 0.45 * fine) }));
    } else if (d.mode === "roll") {
      editPose((s) => ({ ...s, q: turnOnScreen(s.q, "z", -dx * 0.45 * fine) }));
    } else {
      const h = frame.current?.clientHeight ?? 600;
      editPose((s) => {
        const perPx = (2 * Math.abs(s.z) * Math.tan((30 * Math.PI) / 360)) / h;
        return { ...s, x: round(s.x + dx * perPx * fine, 3), y: round(s.y - dy * perPx * fine, 3) };
      });
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    delete e.currentTarget.dataset.mode;
  };
  useEffect(() => {
    const el = frame.current?.querySelector<HTMLElement>("[data-drag]");
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const k = Math.exp(e.deltaY * 0.0012 * (e.ctrlKey || e.metaKey ? 0.25 : 1));
      const { sel: i } = refs.current;
      setPlaying(null);
      setWork((w) => ({
        ...w,
        scenes: w.scenes.map((s, n) => (n === i ? { ...s, z: Math.min(-0.3, Math.max(-30, round(s.z * k, 3))) } : s)),
      }));
      setTime(sceneTimes(refs.current.motion).times[i]?.arrive ?? 0);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const deg = degFromQuat(scene.q);
  const setDeg = (k: "yaw" | "pitch" | "roll", v: number) => {
    if (!Number.isFinite(v)) return;
    const d = { ...deg, [k]: v };
    editPose((s) => ({ ...s, q: quatFromDeg(d.yaw, d.pitch, d.roll) }));
  };
  const turn = (axis: "x" | "y" | "z", by: number) => editPose((s) => ({ ...s, q: turnOnScreen(s.q, axis, by) }));
  const first = sel === 0;
  const playScene = () => {
    if (first) return;
    setTime(times[sel - 1].leave);
    setPlaying({ to: times[sel].leave });
  };

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
            <span className={styles.dragPose}>
              Düzenlenen: {sel + 1} · {scene.name}
            </span>
            <span className={styles.dragHelp}>
              Sürükle: her yöne döndür · Sağ tık veya Shift + sürükle: taşı · Tekerlek: yaklaş / uzaklaş · Alt + sürükle: yatır · Ctrl: hassas
            </span>
          </div>
        </div>

        <div className={styles.scrub}>
          <button type="button" className={styles.play} onClick={() => (playing ? setPlaying(null) : (setTime(time >= total - 0.01 ? 0 : time), setPlaying({ to: total })))}>
            {playing ? "Durdur" : "Tümünü oynat"}
          </button>
          <div className={styles.track}>
            <input
              type="range"
              min={0}
              max={total}
              step={0.01}
              value={Math.min(time, total)}
              onChange={(e) => {
                setPlaying(null);
                setTime(Number(e.target.value));
              }}
              aria-label="Zaman"
            />
            {times.map((t, i) => (
              <button
                key={work.scenes[i].id}
                type="button"
                className={styles.marker}
                data-on={i === sel || undefined}
                style={{ left: `${(t.arrive / total) * 100}%` }}
                onClick={() => select(i)}
                title={work.scenes[i].name}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <span className={styles.time}>
            {time.toFixed(1)} / {total.toFixed(1)} sn
          </span>
        </div>
        <p className={styles.note}>
          Kaydırıcı, sayfayı aşağı kaydırmak gibidir; numaralar sahnelerin tam oturduğu anlardır. Tüm hareket sayfada yaklaşık{" "}
          {((total * work.speed) / 100).toFixed(1)} ekran boyu kaydırmaya yayılır.
        </p>
      </div>

      {/* ---------------------------------------------------------- controls */}
      <div className={styles.controls}>
        {fromDraft && (
          <p className={styles.banner}>
            Önceki çalışmanızda tek tek kaydettiğiniz sahneler yüklendi; henüz dosyaya yazılmadı.{" "}
            <button type="button" onClick={backToFile}>
              Dosyadakine dön
            </button>
          </p>
        )}

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>Sahneler</h2>
          <ol className={styles.scenes}>
            {work.scenes.map((s, i) => (
              <li key={s.id}>
                <button type="button" className={styles.sceneRow} aria-pressed={i === sel} onClick={() => select(i)}>
                  <span className={styles.sceneNo}>{i + 1}</span>
                  <span className={styles.sceneName}>{s.name}</span>
                  <span className={styles.sceneMeta}>
                    {i === 0 ? "açılış" : `${s.move}s${s.spins ? ` · ${Math.abs(s.spins)} tur` : ""}${s.fade ? " · kaybolur" : ""}`}
                  </span>
                  <span className={styles.sceneState} data-unsaved={unsaved(s) || undefined}>
                    {unsaved(s) ? "kaydedilmedi" : "✓"}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className={styles.rowActions}>
            <button type="button" className={styles.secondary} onClick={addAfter}>
              + Bu sahneden sonra ekle
            </button>
            <button type="button" className={styles.secondary} onClick={() => move(-1)} disabled={sel === 0}>
              ↑
            </button>
            <button type="button" className={styles.secondary} onClick={() => move(1)} disabled={sel === work.scenes.length - 1}>
              ↓
            </button>
            <button type="button" className={styles.danger} onClick={remove}>
              Sil
            </button>
          </div>
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>
            Sahne {sel + 1}
            <input className={styles.nameInput} value={scene.name} onChange={(e) => edit((s) => ({ ...s, name: e.target.value }))} aria-label="Sahne adı" />
          </h2>

          <p className={styles.sub}>Saatin açısı</p>
          <div className={styles.turns}>
            {(
              [
                ["y", "Sağa-sola"],
                ["x", "Öne-arkaya"],
                ["z", "Kendi ekseni"],
              ] as const
            ).map(([axis, label]) => (
              <div key={axis} className={styles.turnRow}>
                <span>{label}</span>
                {[-45, -5, 5, 45].map((by) => (
                  <button key={by} type="button" onClick={() => turn(axis, by)}>
                    {by > 0 ? `+${by}°` : `${by}°`}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.degs}>
            {(
              [
                ["yaw", "Dönüş"],
                ["pitch", "Eğim"],
                ["roll", "Yatış"],
              ] as const
            ).map(([k, label]) => (
              <label key={k}>
                <span>{label} °</span>
                <input type="number" step={1} value={deg[k]} onChange={(e) => setDeg(k, Number(e.target.value))} />
              </label>
            ))}
          </div>

          <p className={styles.sub}>Konum</p>
          {(
            [
              ["x", "Sağ — sol", -3, 3, 0.01],
              ["y", "Yukarı — aşağı", -3, 3, 0.01],
              ["z", "Uzaklık (küçük = yakın)", -12, -0.3, 0.01],
            ] as const
          ).map(([k, label, min, max, step]) => (
            <label key={k} className={styles.axis}>
              <span className={styles.axisLabel}>{label}</span>
              <input type="range" min={min} max={max} step={step} value={scene[k]} onChange={(e) => editPose((s) => ({ ...s, [k]: Number(e.target.value) }))} />
              <span className={styles.number}>
                <input type="number" step={step} value={scene[k]} onChange={(e) => Number.isFinite(Number(e.target.value)) && editPose((s) => ({ ...s, [k]: Number(e.target.value) }))} />
              </span>
            </label>
          ))}

          {!first && (
            <>
              <p className={styles.sub}>Bu sahneye geçiş</p>
              <div className={styles.grid2}>
                <label>
                  <span>Dönüş süresi (sn)</span>
                  <input type="number" min={0.1} step={0.1} value={scene.move} onChange={(e) => edit((s) => ({ ...s, move: Math.max(0.1, Number(e.target.value) || 0.1) }))} />
                </label>
                <label>
                  <span>Tam tur (− ters yön)</span>
                  <input type="number" min={-6} max={6} step={1} value={scene.spins} onChange={(e) => edit((s) => ({ ...s, spins: Math.round(Number(e.target.value) || 0) }))} />
                </label>
                <label>
                  <span>Tur ekseni</span>
                  <select value={scene.axis} onChange={(e) => edit((s) => ({ ...s, axis: e.target.value as "a" | "b" }))}>
                    <option value="a">Çapraz A (sağ üst)</option>
                    <option value="b">Çapraz B (sol üst)</option>
                  </select>
                </label>
                <label className={styles.check}>
                  <input type="checkbox" checked={scene.fade} onChange={(e) => edit((s) => ({ ...s, fade: e.target.checked }))} />
                  <span>Bu sahneye giderken kaybolsun</span>
                </label>
              </div>
            </>
          )}

          <p className={styles.sub}>Bu sahnede</p>
          <div className={styles.grid2}>
            <label>
              <span>Bekleme (sn)</span>
              <input type="number" min={0} step={0.1} value={scene.hold} onChange={(e) => edit((s) => ({ ...s, hold: Math.max(0, Number(e.target.value) || 0) }))} />
            </label>
            {!first && (
              <label>
                <span>Yanında yazı</span>
                <select value={scene.line ?? ""} onChange={(e) => edit((s) => ({ ...s, line: e.target.value === "" ? null : Number(e.target.value) }))}>
                  <option value="">Yok</option>
                  {stage.lines.map((l, i) => (
                    <option key={l.title} value={i}>
                      {String(i + 1).padStart(2, "0")} · {l.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className={styles.rowActions}>
            <button type="button" className={styles.save} onClick={saveScene} disabled={!unsaved(scene)}>
              {unsaved(scene) ? "Sahneyi kaydet" : "Sahne kaydedildi ✓"}
            </button>
            {!first && (
              <button type="button" className={styles.secondary} onClick={playScene}>
                Bu geçişi oynat
              </button>
            )}
            <button type="button" className={styles.secondary} onClick={revertScene} disabled={!keptScene || !unsaved(scene)}>
              Geri al
            </button>
          </div>
        </section>

        <section className={`${styles.block} ${styles.final}`}>
          <h2 className={styles.blockTitle}>Hepsi</h2>
          <label className={styles.axis}>
            <span className={styles.axisLabel}>Kaydırma uzunluğu (büyük = sayfada daha yavaş)</span>
            <input type="range" min={20} max={200} step={1} value={work.speed} onChange={(e) => setWork((w) => ({ ...w, speed: Number(e.target.value) }))} />
            <span className={styles.number}>{work.speed}</span>
          </label>
          <button type="button" className={styles.saveAll} onClick={saveAll} disabled={!fileDirty}>
            {fileDirty ? "Tümünü kaydet" : "Tümü kaydedildi"}
          </button>
          <p className={styles.hint}>
            {unsavedCount > 0
              ? `${unsavedCount} sahnede kaydedilmemiş değişiklik var.`
              : fileDirty
                ? "Sahneler kaydedildi; siteye yansıması için Tümünü kaydet'e basın."
                : "Site bu ayarlarla açılıyor."}
          </p>
        </section>
      </div>
      {status.node}
    </div>
  );
}
