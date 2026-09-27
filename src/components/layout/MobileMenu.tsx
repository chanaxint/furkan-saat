"use client";

import { useEffect, useRef } from "react";
import { BOUTIQUE, NAV_LINKS } from "@/lib/data/navigation";
import { gsap } from "@/lib/gsap";
import styles from "./MobileMenu.module.css";

/**
 * Side drawer menu (every screen size). It slides in from the right over a
 * soft scrim; links rise from masks in sequence.
 */
export function MobileMenu({
  open,
  onNavigate,
  hrefFor = (h) => h,
  onClose,
}: {
  open: boolean;
  onNavigate: (href: string) => (e: React.MouseEvent) => void;
  hrefFor?: (href: string) => string;
  onClose: () => void;
}) {
  const scrim = useRef<HTMLDivElement>(null);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>("[data-item]");
    const meta = el.querySelectorAll<HTMLElement>("[data-meta]");
    const sc = scrim.current;
    gsap.killTweensOf([el, items, meta, sc]);
    if (open) {
      gsap.set([el, sc], { visibility: "visible" });
      gsap.fromTo(
        sc,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: "power2.out" },
      );
      gsap.fromTo(
        el,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.9, ease: "expo.out" },
      );
      gsap.fromTo(
        items,
        { y: 0, yPercent: 110 },
        {
          y: 0,
          yPercent: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.05,
          delay: 0.25,
        },
      );
      gsap.fromTo(
        meta,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.5, stagger: 0.08 },
      );
    } else {
      gsap.to(sc, { autoAlpha: 0, duration: 0.5, ease: "power2.in" });
      gsap.to(el, {
        xPercent: 100,
        duration: 0.7,
        ease: "expo.in",
        onComplete: () => void gsap.set([el, sc], { visibility: "hidden" }),
      });
    }
  }, [open]);

  return (
    <>
      {/* Clicking outside the drawer closes it. */}
      <div
        ref={scrim}
        className={styles.scrim}
        onClick={onClose}
        aria-hidden
        style={{ visibility: "hidden" }}
      />
      <div
        ref={root}
        id="mobile-menu"
        className={styles.menu}
        aria-hidden={!open}
        style={{ visibility: "hidden" }}
      >
        <button
          className={styles.close}
          onClick={onClose}
          tabIndex={open ? 0 : -1}
        >
          Kapat <span aria-hidden>×</span>
        </button>
        <nav className={styles.list} aria-label="Mobil menü">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={hrefFor(l.href)}
              onClick={onNavigate(l.href)}
              className={styles.row}
              tabIndex={open ? 0 : -1}
            >
              <span className={styles.mask}>
                <span data-item className={styles.item}>
                  <span className={styles.index}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {l.label}
                </span>
              </span>
            </a>
          ))}
        </nav>
        <div className={styles.footer}>
          <p data-meta className="t-eyebrow">
            Butik — {BOUTIQUE.city}
          </p>
          <p data-meta className={styles.hours}>
            {BOUTIQUE.hours}
          </p>
          <a
            data-meta
            href={hrefFor("#boutique")}
            onClick={onNavigate("#boutique")}
            className={styles.cta}
            tabIndex={open ? 0 : -1}
          >
            Randevu alın →
          </a>
        </div>
      </div>
    </>
  );
}
