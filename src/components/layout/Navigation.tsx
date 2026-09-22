"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NAV_LINKS } from "@/lib/data/navigation";
import { ScrollTrigger } from "@/lib/gsap";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { MobileMenu } from "./MobileMenu";
import styles from "./Navigation.module.css";

type Mode = "immersive" | "visible" | "hidden";

/**
 * Navigation
 * - `immersive`: during the cinematic opening only a faint wordmark remains
 * - `visible`:   full bar once the story has begun
 * - `hidden`:    tucks away while scrolling down deep in the page, returns on scroll up
 * Theme (ink colour) follows the section under the bar via [data-nav-theme].
 */
export function Navigation() {
  const [mode, setMode] = useState<Mode>("immersive");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const { scrollTo, lenis } = useSmoothScroll();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const down = y > lastY.current;
      lastY.current = y;
      if (y < vh * 0.6) setMode("immersive");
      else if (down && y > vh * 2.5) setMode("hidden");
      else setMode("visible");

      // Sample the section beneath the bar.
      const probe = document.elementsFromPoint(window.innerWidth / 2, 40);
      const themed = probe.map((el) => el.closest<HTMLElement>("[data-nav-theme]")).find(Boolean);
      const next = (themed?.dataset.navTheme as "dark" | "light") ?? "dark";
      setTheme(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open, lenis]);

  const go = (href: string) => (e: React.MouseEvent) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setOpen(false);
    requestAnimationFrame(() => {
      scrollTo(href);
      ScrollTrigger.refresh();
    });
  };

  return (
    <>
      <header
        className={styles.nav}
        data-mode={open ? "visible" : mode}
        data-theme={open ? "light" : theme}
      >
        <div className={styles.inner}>
          <Link href="/" className={styles.wordmark} aria-label="Furkan Saat — home" onClick={go("#top")}>
            Furkan <span>Saat</span>
          </Link>

          <nav className={styles.links} aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={go(l.href)} className={styles.link}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className={styles.aside}>
            <a href="#boutique" onClick={go("#boutique")} className={styles.appointment}>
              Appointment
            </a>
            <button
              className={styles.menuButton}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className={styles.menuLabel}>{open ? "Close" : "Menu"}</span>
              <span className={styles.menuIcon} aria-hidden>
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onNavigate={go} />
    </>
  );
}
