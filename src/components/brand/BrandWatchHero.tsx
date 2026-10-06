"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "./BrandWatchHero.module.css";

const FollowWatchScene = dynamic(() => import("@/components/three/FollowWatchScene"), { ssr: false });

/**
 * A brand page opening with nothing on screen but the watch, head-on at the
 * centre and following the pointer, and the house's name set huge behind it.
 * The site's bar steps aside while it fills the screen.
 */
export function BrandWatchHero({ name, model, label }: { name: string; model: string; label: string }) {
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        // The bar hides while the opening fills most of the screen.
        if (e.intersectionRatio > 0.6) html.dataset.intro = "";
        else delete html.dataset.intro;
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete html.dataset.intro;
    };
  }, []);

  return (
    <section ref={root} className={styles.hero} data-nav-theme="light" aria-label={name}>
      <p className={styles.name} lang="en" aria-hidden>
        {name}
      </p>
      <div className={styles.stage} data-ready={ready || undefined} role="img" aria-label={label}>
        <FollowWatchScene model={model} active={visible} onReady={() => setReady(true)} />
      </div>
    </section>
  );
}
