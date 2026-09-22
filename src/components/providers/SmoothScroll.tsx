"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

type ScrollApi = {
  lenis: Lenis | null;
  /** Scroll to an anchor (#id), element or y offset with the house easing. */
  scrollTo: (target: string | HTMLElement | number, opts?: { offset?: number; immediate?: boolean }) => void;
};

const ScrollContext = createContext<ScrollApi>({ lenis: null, scrollTo: () => {} });

export const useSmoothScroll = () => useContext(ScrollContext);

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis
 * share one clock. Native scroll is kept (no scroll-jacking): Lenis only
 * interpolates wheel input; touch devices use native momentum.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const instance = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = instance;
    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  // Refresh triggers once fonts have settled (layout shifts change offsets).
  useEffect(() => {
    if (typeof document === "undefined" || !("fonts" in document)) return;
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }, []);

  const api: ScrollApi = {
    lenis,
    scrollTo: (target, opts = {}) => {
      const l = lenisRef.current;
      if (l) {
        l.scrollTo(target as never, {
          offset: opts.offset ?? 0,
          immediate: opts.immediate,
          duration: 1.8,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
        });
        return;
      }
      let y = 0;
      if (typeof target === "number") y = target;
      else {
        const el = typeof target === "string" ? document.querySelector(target) : target;
        if (!el) return;
        y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY;
      }
      window.scrollTo({ top: y + (opts.offset ?? 0), behavior: opts.immediate ? "auto" : "smooth" });
    },
  };

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
