/**
 * Scroll-scrubbed footage as an image sequence drawn to a 2D canvas.
 * (A <video> element cannot seek frame-accurately fast enough while
 * scrubbing, especially on Safari; still frames always can.)
 *
 * Frames load coarse-to-fine — 0, then every 16th, 8th, 4th, 2nd, all — so
 * scrubbing works almost immediately and sharpens as loading completes.
 * Between two frames the next one is blended in, which keeps slow scrolls
 * smooth even at 24 fps source material.
 */
export class FrameSequence {
  private images: (HTMLImageElement | null)[];
  private ctx: CanvasRenderingContext2D;
  private last = -1;
  private disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private src: (i: number) => string,
    private count: number,
    private onFirstFrame?: () => void,
  ) {
    this.images = new Array(count).fill(null);
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.load();
  }

  private load() {
    const order: number[] = [];
    const seen = new Set<number>();
    for (const step of [this.count, 16, 8, 4, 2, 1]) {
      for (let i = 0; i < this.count; i += step) {
        if (!seen.has(i)) {
          seen.add(i);
          order.push(i);
        }
      }
    }
    let cursor = 0;
    const next = () => {
      if (this.disposed || cursor >= order.length) return;
      const i = order[cursor++];
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        this.images[i] = img;
        if (i === 0) this.onFirstFrame?.();
        if (this.last < 0 || Math.abs(Math.round(this.last) - i) < 2) this.draw(this.last < 0 ? 0 : this.last, true);
        next();
      };
      img.onerror = next;
      img.src = this.src(i);
    };
    // A few parallel lanes keep the network busy without flooding it.
    for (let lane = 0; lane < 6; lane++) next();
  }

  private nearest(i: number) {
    for (let d = 0; d < this.count; d++) {
      const a = this.images[i - d];
      if (a) return a;
      const b = this.images[i + d];
      if (b) return b;
    }
    return null;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.draw(Math.max(0, this.last), true);
    }
  }

  private cover(img: HTMLImageElement, alpha: number) {
    const { width: W, height: H } = this.canvas;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }

  /** Draw fractional frame `f` (blends frame ⌊f⌋ into ⌊f⌋ + 1). */
  draw(f: number, force = false) {
    if (!force && Math.abs(f - this.last) < 0.01) return;
    this.last = f;
    const i = Math.max(0, Math.min(this.count - 1, Math.floor(f)));
    const t = f - i;
    const a = this.images[i] ?? this.nearest(i);
    if (!a) return;
    this.cover(a, 1);
    const b = this.images[i + 1];
    if (b && t > 0.02) this.cover(b, t);
    this.ctx.globalAlpha = 1;
  }

  dispose() {
    this.disposed = true;
  }
}
