"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./CampaignHero.module.css";

/** How long each photograph stays before the next slides in (ms). */
const HOLD_MS = 6000;

type Slide = {
  image: string;
  alt: string;
  /** Phones: where the upright cut sits on the photograph. */
  focus: string;
  /** A cut-out of the model laid over the giant lettering (the first photograph only). */
  cutout?: string;
  lines: [string, string];
  href: string;
  slogan: string;
};

const SLIDES: Slide[] = [
  {
    image: "/assets/images/campaign/zamansiz.webp",
    cutout: "/assets/images/campaign/zamansiz-model.webp",
    alt: "Bileğinde altın ve çelik tonlarında dikdörtgen kasalı bir saat taşıyan kadın",
    focus: "46% 18%",
    lines: ["Yeni sezon saatler", "Sınırlı sayıda"],
    href: "/#koleksiyon",
    slogan: "zamansız, zarif & size özel.",
  },
  {
    image: "/assets/images/campaign/essence-sedef.webp",
    alt: "Koyu taş üzerinde sedef kadranlı, taşlı çerçeveli, gümüş-rose bicolor Essence kadın saati",
    focus: "48% 50%",
    lines: ["Sedef & taş", "Essence koleksiyonu"],
    href: "/markalar/essence",
    slogan: "ışığı yakalayan zarafet.",
  },
  {
    image: "/assets/images/campaign/kronograf.webp",
    alt: "Lacivert ceketli bir adamın bileğinde antrasit kadranlı çelik kronograf",
    focus: "50% 30%",
    lines: ["Erkek koleksiyonu", "Kronograflar"],
    href: "/erkek",
    slogan: "güçlü, net & size özel.",
  },
];

/**
 * CAMPAIGN — the shop's front window after the opening: three full-width
 * photographs that slide one after another on their own (every few seconds,
 * the next coming in from the right, always the same way round: after the
 * last comes the first again), each with its lines and a way into the
 * shop. The first sets the house name huge behind the model.
 */
export function CampaignHero() {
  // `at` runs 0…SLIDES.length: the last position is a copy of the first, so
  // after the last photograph the row keeps moving the same way onto the
  // first; once there it jumps back (unseen, no transition) to the real one.
  const [at, setAt] = useState(0);
  const [snap, setSnap] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setAt((i) => i + 1), HOLD_MS);
    return () => clearTimeout(t);
  }, [at]);
  const onSlid = () => {
    if (at === SLIDES.length) {
      setSnap(true);
      setAt(0);
    }
  };
  // The jump has been painted without a transition: let the next slide animate again.
  useEffect(() => {
    if (!snap) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
    return () => cancelAnimationFrame(r);
  }, [snap]);
  const shown = at % SLIDES.length;
  const row = [...SLIDES, SLIDES[0]];

  return (
    <section id="kampanya" className={styles.hero} data-nav-theme="light" data-nav-keep aria-label="Yeni sezon" aria-roledescription="carousel">
      <div className={styles.frame}>
        <div
          className={styles.slides}
          style={{ transform: `translateX(${-at * 100}%)`, transition: snap ? "none" : undefined }}
          onTransitionEnd={(e) => e.target === e.currentTarget && onSlid()}
        >
          {row.map((s, i) => (
            <div key={i} className={styles.slide} aria-hidden={i !== at} style={{ "--focus": s.focus } as React.CSSProperties}>
              <Image src={s.image} alt={i === SLIDES.length ? "" : s.alt} fill sizes="100vw" priority={i === 0} className={styles.photo} />
              {s.cutout && (
                <>
                  <p className={styles.giant} aria-hidden>
                    Furkan
                  </p>
                  <Image src={s.cutout} alt="" fill sizes="100vw" className={styles.photo} aria-hidden />
                </>
              )}
              <div className={styles.copy}>
                <p className={styles.line}>{s.lines[0]}</p>
                <p className={styles.line}>{s.lines[1]}</p>
                <Link href={s.href} className={styles.button} tabIndex={i === at ? undefined : -1}>
                  Alışverişe başla
                </Link>
              </div>
              <p className={styles.slogan}>{s.slogan}</p>
            </div>
          ))}
        </div>
        <div className={styles.dots}>
          {SLIDES.map((s, i) => (
            <button key={s.image} type="button" className={styles.dot} aria-current={i === shown || undefined} aria-label={`${i + 1}. fotoğraf`} onClick={() => setAt(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
