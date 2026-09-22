"use client";

import { createElement, useRef, type ElementType } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

type Props = {
  /** Use "\n" to force editorial line breaks. `*word*` renders in italics. */
  text: string;
  as?: ElementType;
  className?: string;
  /** Animate when scrolled into view (default) or immediately on mount. */
  trigger?: "scroll" | "mount" | "none";
  delay?: number;
  stagger?: number;
  start?: string;
};

/**
 * Editorial headline reveal: each word rises from behind a mask.
 * Text is fully rendered server-side; motion is progressive enhancement.
 */
export function SplitText({
  text,
  as = "h2",
  className,
  trigger = "scroll",
  delay = 0,
  stagger = 0.06,
  start = "top 85%",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || trigger === "none" || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const words = el.querySelectorAll<HTMLElement>(".split-inner");
      gsap.set(words, { yPercent: 110, rotate: 2 });
      gsap.to(words, {
        yPercent: 0,
        rotate: 0,
        duration: 1.5,
        ease: "expo.out",
        stagger,
        delay,
        scrollTrigger: trigger === "scroll" ? { trigger: el, start, once: true } : undefined,
      });
    }, el);
    return () => ctx.revert();
  }, [text, trigger, delay, stagger, start]);

  const lines = text.split("\n");

  return createElement(
    as,
    { ref, className, "aria-label": text.replace(/\*/g, "").replace(/\n/g, " ") },
    lines.map((line, li) => (
      <span className="split-line" key={li} aria-hidden>
        {line.split(" ").map((word, wi, arr) => {
          const italic = word.startsWith("*") && word.endsWith("*");
          const clean = word.replace(/\*/g, "");
          return (
            <span className="split-word" key={wi}>
              <span className="split-inner">{italic ? <em>{clean}</em> : clean}</span>
              {wi < arr.length - 1 ? " " : null}
            </span>
          );
        })}
      </span>
    )),
  );
}
