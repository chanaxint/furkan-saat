/**
 * Water in front of the 3D watch, drawn on a canvas over it: when the splash
 * hits, a burst of spray crosses the watch (right to left, as the filmed
 * water comes in), and drops land on the crystal and case and stay there,
 * the larger ones slowly running down with a thin wet trail, until they fade.
 */

type Spray = { x: number; y: number; vx: number; vy: number; r: number; life: number; age: number };
type Sheet = { y: number; amp: number; w: number; speed: number; age: number; life: number; phase: number };
type Drop = { x: number; y: number; r: number; vy: number; delay: number; age: number; life: number; trail: number; wob: number };

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class WaterDrops {
  private ctx: CanvasRenderingContext2D;
  private spray: Spray[] = [];
  private drops: Drop[] = [];
  private sheets: Sheet[] = [];
  private head = { x: 0, y: 0, r: 0 };
  private dpr = 1;
  /** 0–1, multiplied into everything (to clear them away when the watch moves on). */
  fade = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(window.innerWidth * this.dpr);
    this.canvas.height = Math.round(window.innerHeight * this.dpr);
  }

  get alive() {
    return this.spray.length > 0 || this.drops.length > 0 || this.sheets.length > 0;
  }

  clear() {
    this.spray = [];
    this.drops = [];
    this.sheets = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** The water arrives: (cx, cy) the watch head's centre on screen, r its radius (px). */
  burst(cx: number, cy: number, r: number) {
    this.fade = 1;
    this.head = { x: cx, y: cy, r };
    // A sheet of water sweeping across the watch, right to left, in a few streams.
    for (let i = 0; i < 5; i++) {
      this.sheets.push({ y: rnd(-0.7, 0.7), amp: rnd(0.08, 0.22), w: rnd(0.08, 0.2), speed: rnd(4.2, 6.5), age: rnd(-0.06, 0.04), life: rnd(0.38, 0.55), phase: rnd(0, 6.28) });
    }
    // Spray thrown across the watch from its right side.
    for (let i = 0; i < 280; i++) {
      const a = rnd(-0.6, 0.5) + Math.PI; // leftwards, fanning up and down
      const v = rnd(1100, 2800) * (r / 300);
      this.spray.push({
        x: cx + r * rnd(0.6, 1.25),
        y: cy + r * rnd(-0.9, 0.9),
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - rnd(0, 250),
        r: rnd(1.5, 5.5) * (r / 300),
        life: rnd(0.4, 0.9),
        age: 0,
      });
    }
    // Drops that land on the watch and cling to it.
    for (let i = 0; i < 70; i++) {
      const ang = rnd(0, Math.PI * 2);
      const d = Math.sqrt(Math.random()) * r * 1.08;
      const big = Math.random() < 0.3;
      this.drops.push({
        x: cx + Math.cos(ang) * d,
        y: cy + Math.sin(ang) * d * 1.15,
        r: (big ? rnd(9, 17) : rnd(3.5, 8)) * (r / 300),
        vy: 0,
        delay: rnd(0.02, 0.32),
        age: 0,
        life: rnd(3.2, 5.5),
        trail: 0,
        wob: rnd(0, 6.28),
      });
    }
  }

  /** Advance by dt seconds and draw. Returns whether anything is left. */
  frame(dt: number) {
    const { ctx, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = 2200;

    // The sheet: broad translucent streams crossing the watch.
    this.sheets = this.sheets.filter((sh) => (sh.age += dt) < sh.life);
    const H = this.head;
    for (const sh of this.sheets) {
      if (sh.age < 0) continue;
      const k = sh.age / sh.life;
      const front = H.x + H.r * 1.4 - k * sh.speed * H.r * 0.55; // leading edge moving left
      const tail = front + H.r * 1.6;
      const a = Math.sin(Math.PI * k) * this.fade;
      const yc = H.y + sh.y * H.r;
      const thick = sh.w * H.r;
      ctx.beginPath();
      for (let x = front; x <= tail; x += 6) {
        const yy = yc + Math.sin((x / H.r) * 6 + sh.phase + k * 8) * sh.amp * H.r * 0.4 - thick / 2;
        if (x === front) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      for (let x = tail; x >= front; x -= 6) {
        const yy = yc + Math.sin((x / H.r) * 6 + sh.phase + k * 8 + 0.8) * sh.amp * H.r * 0.4 + thick / 2;
        ctx.lineTo(x, yy);
      }
      ctx.closePath();
      const gr = ctx.createLinearGradient(front, 0, tail, 0);
      gr.addColorStop(0, `rgba(255,255,255,${0.45 * a})`);
      gr.addColorStop(0.3, `rgba(225,236,240,${0.22 * a})`);
      gr.addColorStop(1, "rgba(225,236,240,0)");
      ctx.save();
      ctx.filter = `blur(${Math.max(2, H.r * 0.012)}px)`;
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.restore();
    }

    // Spray: fast streaks of water.
    this.spray = this.spray.filter((p) => (p.age += dt) < p.life);
    for (const p of this.spray) {
      p.vy += g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = (1 - p.age / p.life) * this.fade;
      // A droplet stretched a little along its flight: dark rim, bright glint.
      const sp = Math.hypot(p.vx, p.vy);
      const ang = Math.atan2(p.vy, p.vx);
      const stretch = 1 + Math.min(1.6, sp / 1400);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = `rgba(40, 56, 62, ${0.42 * a})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * stretch, p.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(235, 243, 246, ${0.55 * a})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * stretch * 0.72, p.r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * a})`;
      ctx.beginPath();
      ctx.ellipse(p.r * stretch * 0.25, -p.r * 0.3, p.r * 0.32, p.r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Clinging drops: appear as the water lands, the heavier ones run down.
    this.drops = this.drops.filter((d) => (d.age += dt) < d.delay + d.life);
    for (const d of this.drops) {
      const t = d.age - d.delay;
      if (t < 0) continue;
      if (d.r > 4.5 && t > 0.6) {
        d.vy = Math.min(d.vy + 60 * dt, 90 * (d.r / 8));
        d.y += d.vy * dt;
        d.x += Math.sin(t * 3 + d.wob) * 6 * dt;
        d.trail = Math.min(d.trail + d.vy * dt, d.r * 9);
      }
      const a = Math.min(1, t / 0.08) * Math.min(1, (d.delay + d.life - d.age) / 1.2) * this.fade;
      if (a <= 0.01) continue;
      // Wet trail.
      if (d.trail > 1) {
        const tg = ctx.createLinearGradient(d.x, d.y - d.trail, d.x, d.y);
        tg.addColorStop(0, "rgba(255,255,255,0)");
        tg.addColorStop(1, `rgba(255,255,255,${0.35 * a})`);
        ctx.fillStyle = tg;
        ctx.fillRect(d.x - d.r * 0.35, d.y - d.trail, d.r * 0.7, d.trail);
      }
      // Shadow below, body (a lens: darker rim, clear centre), highlight.
      ctx.fillStyle = `rgba(20, 28, 32, ${0.3 * a})`;
      ctx.beginPath();
      ctx.ellipse(d.x + d.r * 0.18, d.y + d.r * 0.28, d.r, d.r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
      const body = ctx.createRadialGradient(d.x - d.r * 0.2, d.y - d.r * 0.25, d.r * 0.1, d.x, d.y, d.r);
      body.addColorStop(0, `rgba(255,255,255,${0.4 * a})`);
      body.addColorStop(0.55, `rgba(220,232,236,${0.16 * a})`);
      body.addColorStop(1, `rgba(30,45,50,${0.62 * a})`);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r, d.r * 1.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
      ctx.beginPath();
      ctx.ellipse(d.x - d.r * 0.35, d.y - d.r * 0.4, d.r * 0.26, d.r * 0.18, -0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    return this.alive;
  }
}
