"use client";

import { useEffect, useRef } from "react";
import { BOUTIQUE, NAV_LINKS } from "@/lib/data/navigation";
import { gsap } from "@/lib/gsap";
import styles from "./MobileMenu.module.css";

/**
 * Full-screen ivory menu for tablet & mobile. Links rise from masks in
 * sequence; the panel wipes in from the top like a curtain.
 */
export function MobileMenu({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: (href: string) => (e: React.MouseEvent) => void;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>("[data-item]");
    const meta = el.querySelectorAll<HTMLElement>("[data-meta]");
    gsap.killTweensOf([el, items, meta]);
    if (open) {
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "expo.inOut" });
      gsap.fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.06, delay: 0.45 });
      gsap.fromTo(meta, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1, delay: 0.8, stagger: 0.08 });
    } else {
      gsap.to(el, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.9,
        ease: "expo.inOut",
        onComplete: () => void gsap.set(el, { visibility: "hidden" }),
      });
    }
  }, [open]);

  return (
    <div ref={root} id="mobile-menu" className={styles.menu} aria-hidden={!open} style={{ visibility: "hidden" }}>
      <nav className={styles.list} aria-label="Mobile">
        {NAV_LINKS.map((l, i) => (
          <a key={l.href} href={l.href} onClick={onNavigate(l.href)} className={styles.row} tabIndex={open ? 0 : -1}>
            <span className={styles.mask}>
              <span data-item className={styles.item}>
                <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                {l.label}
              </span>
            </span>
          </a>
        ))}
      </nav>
      <div className={styles.footer}>
        <p data-meta className="t-eyebrow">Boutique — {BOUTIQUE.city}</p>
        <p data-meta className={styles.hours}>{BOUTIQUE.hours}</p>
        <a data-meta href="#boutique" onClick={onNavigate("#boutique")} className={styles.cta} tabIndex={open ? 0 : -1}>
          Book an appointment →
        </a>
      </div>
    </div>
  );
}
