"use client";

import { createElement, useRef, type ElementType, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  y?: number;
  /** Reveal direct children one after another. */
  stagger?: number;
  start?: string;
};

/** Slow fade-and-rise on scroll. Content is visible if JS never runs. */
export function Reveal({ children, as = "div", className, delay = 0, y = 28, stagger, start = "top 88%" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const targets = stagger ? Array.from(el.children) : el;
      gsap.from(targets, {
        autoAlpha: 0,
        y,
        duration: 1.6,
        ease: "expo.out",
        delay,
        stagger: stagger ?? 0,
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [delay, y, stagger, start]);

  return createElement(as, { ref, className, "data-reveal": "" }, children);
}
