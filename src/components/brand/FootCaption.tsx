"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FootCaption.module.css";

/**
 * Words over the photograph that closes a brand page. They fade in slowly,
 * one after another, once most of the photograph is on screen (an
 * IntersectionObserver on the photograph, so it holds however the page above
 * settles), and only once.
 */
export function FootCaption({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const photo = el?.parentElement;
    if (!el || !photo) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.6) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(photo);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${styles.caption} ${className ?? ""}`} data-shown={shown ? "" : undefined}>
      {children}
    </div>
  );
}
