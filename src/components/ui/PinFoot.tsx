"use client";

import { useEffect, useRef } from "react";

/**
 * Placed inside a `position: sticky` section: sets its `top` so that, once its
 * foot reaches the bottom of the screen, it stays there and what follows
 * rises over it like a separate layer.
 */
export function PinFoot() {
  const probe = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const section = probe.current?.parentElement;
    if (!section) return;
    const set = () => (section.style.top = `${Math.min(0, window.innerHeight - section.offsetHeight)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(section);
    window.addEventListener("resize", set);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);
  return <span ref={probe} hidden />;
}
