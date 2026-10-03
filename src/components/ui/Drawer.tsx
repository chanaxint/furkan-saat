"use client";

import { useEffect, type ReactNode } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import styles from "./Drawer.module.css";

/**
 * The one side panel of the site (menu, filters, cart). Slides in from the
 * right over a soft scrim; Escape or a click outside closes it, and the page
 * behind stops scrolling while it is open.
 */
export function Drawer({
  open,
  onClose,
  label,
  title,
  side = "right",
  size = "default",
  tone = "light",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  title?: ReactNode;
  side?: "right" | "left";
  /** `half`: the panel takes half the page (full width on phones). */
  size?: "default" | "half";
  /** `green`: house green with ivory text instead of ivory. */
  tone?: "light" | "green";
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { lenis } = useSmoothScroll();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose, lenis]);

  return (
    <div className={styles.root} data-open={open || undefined} data-side={side} data-size={size} data-tone={tone} aria-hidden={!open} inert={!open}>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label={label}>
        <header className={styles.head}>
          <p className={styles.title}>{title ?? label}</p>
          <button className={styles.close} onClick={onClose}>
            Kapat <span aria-hidden>×</span>
          </button>
        </header>
        <div className={styles.body} data-lenis-prevent>
          {children}
        </div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </aside>
    </div>
  );
}
