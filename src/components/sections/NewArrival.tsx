"use client";

import { useEffect, useRef } from "react";
import { FrameSequence } from "@/components/sections/hero/FrameSequence";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { useGsap } from "@/hooks/useGsap";
import { NEW_ARRIVAL } from "@/lib/data/watches";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { NEW_ARRIVAL_FILM as FILM, newArrivalFrameSrc } from "@/lib/scene/newArrival";
import styles from "./NewArrival.module.css";

/**
 * 05 — NEW ARRIVAL
 * Scroll opens the Jacob & Co. box and lifts the watch out (scrubbed film).
 * On the last frame the film hands over to a two-layer still — box plate and
 * cut-out watch — and only the watch follows the pointer, like a 3D object.
 */
export function NewArrival() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLCanvasElement>(null);
  const watch = useRef<HTMLImageElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const seq = useRef<FrameSequence | null>(null);
  const live = useRef(false);

  // Frames load when the section comes near; the layer is placed to match the film.
  useEffect(() => {
    const el = root.current;
    if (!el || !film.current) return;
    const place = () => {
      const s = stage.current;
      if (!s) return;
      const W = s.clientWidth;
      const H = s.clientHeight;
      const c = Math.max(W / FILM.width, H / FILM.height);
      const ox = (W - FILM.width * c) / 2;
      const oy = (H - FILM.height * c) / 2;
      s.style.setProperty("--wx", `${ox + FILM.layer.x * c}px`);
      s.style.setProperty("--wy", `${oy + FILM.layer.y * c}px`);
      s.style.setProperty("--ww", `${FILM.layer.w * c}px`);
      seq.current?.resize();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || seq.current || !film.current) return;
        seq.current = new FrameSequence(film.current, newArrivalFrameSrc, FILM.count);
        place();
        seq.current.draw(0, true);
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    place();
    window.addEventListener("resize", place);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", place);
      seq.current?.dispose();
      seq.current = null;
    };
  }, []);

  // Pointer: only the watch layer turns and drifts, with a soft follow.
  useEffect(() => {
    const el = root.current;
    const w = watch.current;
    if (!el || !w || prefersReducedMotion()) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      w.style.transform =
        `perspective(1400px) translate3d(${(cur.x * 10).toFixed(2)}px, ${(cur.y * 6).toFixed(2)}px, 0) ` +
        `rotateY(${(cur.x * 9).toFixed(3)}deg) rotateX(${(-cur.y * 6).toFixed(3)}deg)`;
      if (Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.0005) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (!live.current) return;
      const r = el.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      kick();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  useGsap(() => {
    const el = root.current!;
    const state = { frame: 0 };
    const last = FILM.count - 1;
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    tl.to(state, { frame: last, duration: 7, ease: "power1.inOut" }, 0);
    if (copy.current) tl.fromTo(copy.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.4, ease: "power2.out" }, 5.2);
    tl.set({}, {}, 10);
    tl.eventCallback("onUpdate", () => {
      seq.current?.draw(state.frame);
      // Hand over to the interactive still on the last frame.
      const atEnd = state.frame >= last - 0.5;
      if (atEnd !== live.current) {
        live.current = atEnd;
        el.toggleAttribute("data-live", atEnd);
        if (!atEnd && watch.current) watch.current.style.transform = "";
      }
    });
    gsap.timeline({
      scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 1 },
    }).add(tl);
  }, root);

  return (
    <section ref={root} className={styles.section} id="new-arrival" data-nav-theme="dark" aria-label="Yeni gelen">
      <div className={styles.pin}>
        <div ref={stage} className={styles.stage}>
          <canvas ref={film} className={styles.film} aria-hidden />
          {/* The last frame, split: the box (plate) and the watch alone. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FILM.plate} alt="" className={styles.plate} aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={watch}
            src={FILM.watch}
            alt={`${NEW_ARRIVAL.brand} ${NEW_ARRIVAL.model}`}
            className={styles.watch}
            draggable={false}
          />
          <div className={styles.shade} aria-hidden />
        </div>

        <div ref={copy} className={styles.copy}>
          <p className={styles.eyebrow}>
            <span>05</span>
            <span className={styles.rule} aria-hidden />
            <span>Yeni Gelen</span>
          </p>
          <p className={styles.brand} lang="en">
            {NEW_ARRIVAL.brand}
          </p>
          <h2 className={styles.model}>{NEW_ARRIVAL.model}</h2>
          <p className={styles.description}>{NEW_ARRIVAL.description}</p>
          <dl className={styles.specs}>
            {NEW_ARRIVAL.details.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <ArrowLink href={NEW_ARRIVAL.href}>Saati keşfedin</ArrowLink>
        </div>
      </div>
    </section>
  );
}
