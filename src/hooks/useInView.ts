"use client";

import { useEffect, useState, type RefObject } from "react";

/** Lightweight visibility flag — used to pause WebGL render loops offscreen. */
export function useInView(ref: RefObject<Element | null>, rootMargin = "20% 0px") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
