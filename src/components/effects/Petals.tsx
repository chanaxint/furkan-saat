"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

/**
 * Cherry-blossom petals drifting down over a photograph (canvas). Near petals
 * are larger, faster and out of focus; far ones small and sharp. Each tumbles
 * as it falls (a flip about its length) and sways on the air. Runs only while
 * on screen and the tab is visible; with reduced motion it stays still.
 */
export function Petals({
  className,
  density = 1,
  wind = false,
}: {
  className?: string;
  density?: number;
  /** Some petals also cross the screen from the sides, carried on the wind. */
  wind?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const still = prefersReducedMotion();

    // A petal sprite at three depths of focus.
    const SPRITE = 96;
    const sprites = [0, 2.2, 7].map((blur) => {
      const s = document.createElement("canvas");
      s.width = s.height = SPRITE;
      const g = s.getContext("2d")!;
      g.translate(SPRITE / 2, SPRITE / 2);
      if (blur) g.filter = `blur(${blur}px)`;
      const L = SPRITE * 0.34;
      const W = SPRITE * 0.2;
      // Rounded body, a small notch at the tip (the sakura petal).
      g.beginPath();
      g.moveTo(0, L);
      g.bezierCurveTo(W * 1.25, L * 0.55, W * 1.1, -L * 0.75, W * 0.32, -L);
      g.lineTo(0, -L * 0.8);
      g.lineTo(-W * 0.32, -L);
      g.bezierCurveTo(-W * 1.1, -L * 0.75, -W * 1.25, L * 0.55, 0, L);
      g.closePath();
      const fill = g.createLinearGradient(0, L, 0, -L);
      fill.addColorStop(0, "#e98fb0");
      fill.addColorStop(0.35, "#f6bcd0");
      fill.addColorStop(1, "#fde8f0");
      g.fillStyle = fill;
      g.fill();
      // A soft light along one side.
      const sheen = g.createLinearGradient(-W, 0, W, 0);
      sheen.addColorStop(0, "rgba(255,255,255,0)");
      sheen.addColorStop(0.7, "rgba(255,255,255,0.35)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = sheen;
      g.fill();
      return s;
    });

    type Petal = { x: number; y: number; z: number; rot: number; spin: number; flip: number; flipV: number; sway: number; swayV: number; vy: number; vx: number };
    let w = 0;
    let h = 0;
    let dpr = 1;
    let petals: Petal[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const make = (top: boolean): Petal => {
      // Mostly far, some mid, a few near the lens.
      const r = Math.random();
      const z = r < 0.6 ? rnd(0, 0.35) : r < 0.92 ? rnd(0.35, 0.75) : rnd(0.75, 1);
      // On the wind: in from the left or the right edge, across and gently down.
      if (wind && top && Math.random() < 0.4) {
        const fromLeft = Math.random() < 0.5;
        return {
          x: fromLeft ? -60 : w + 60,
          y: rnd(-0.05, 0.75) * h,
          z,
          rot: rnd(0, Math.PI * 2),
          spin: rnd(-1.4, 1.4) * (0.4 + z),
          flip: rnd(0, Math.PI * 2),
          flipV: rnd(1.6, 3.6),
          sway: rnd(0, Math.PI * 2),
          swayV: rnd(0.6, 1.3),
          vy: (14 + 34 * z) * rnd(0.7, 1.2),
          vx: (fromLeft ? 1 : -1) * (60 + 120 * z) * rnd(0.8, 1.25),
        };
      }
      return {
        x: rnd(-0.1, 1.1) * w,
        y: top ? rnd(-0.25, -0.02) * h : rnd(-0.1, 1) * h,
        z,
        rot: rnd(0, Math.PI * 2),
        spin: rnd(-1, 1) * (0.4 + z),
        flip: rnd(0, Math.PI * 2),
        flipV: rnd(1.2, 3.2),
        sway: rnd(0, Math.PI * 2),
        swayV: rnd(0.5, 1.2),
        vy: (28 + 70 * z) * rnd(0.8, 1.2),
        vx: rnd(6, 26) * (0.5 + z),
      };
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      const n = Math.round(Math.min(70, Math.max(24, (w * h) / 26000)) * density);
      petals = Array.from({ length: n }, () => make(false));
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        const size = 10 + p.z * p.z * 64;
        const sprite = sprites[p.z > 0.75 ? 2 : p.z > 0.45 ? 1 : 0];
        ctx.save();
        ctx.translate(p.x + Math.sin(p.sway) * (8 + 30 * p.z), p.y);
        ctx.rotate(p.rot);
        // The tumble: the petal turns edge-on and back.
        ctx.scale(1, 0.25 + 0.75 * Math.abs(Math.cos(p.flip)));
        ctx.globalAlpha = 0.55 + 0.4 * (1 - Math.abs(p.z - 0.5));
        const d = size * (SPRITE / (SPRITE * 0.68));
        ctx.drawImage(sprite, -d / 2, -d / 2, d, d);
        ctx.restore();
      }
    };

    let raf = 0;
    let last = performance.now();
    let running = false;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.rot += p.spin * dt;
        p.flip += p.flipV * dt;
        p.sway += p.swayV * dt;
        if (p.y > h + 60 || p.x > w + 80 || p.x < -80) petals[i] = make(true);
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || still) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    draw();
    let visible = true;
    const sync = () => (visible && !document.hidden ? start() : stop());
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(c);
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(c);
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [density, wind]);

  return <canvas ref={canvas} className={className} aria-hidden />;
}
