"use client";

import Link from "next/link";
import { useRef } from "react";
import { MediaSlot } from "@/components/media/MediaSlot";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitText } from "@/components/ui/SplitText";
import { useGsap } from "@/hooks/useGsap";
import { MOST_WANTED_IDS, WATCHES, formatPrice } from "@/lib/data/watches";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./MostWanted.module.css";

const PIECES = MOST_WANTED_IDS.map((id) => WATCHES.find((w) => w.id === id)!).filter(Boolean);
const RATIOS = ["4 / 5", "3 / 4", "3 / 4", "4 / 5"];

/**
 * 06 — MOST WANTED
 * Four pieces in an asymmetric editorial layout. The ivory page rises over
 * the green like a curtain — the first tonal shift of the page.
 */
export function MostWanted() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);

    // Ivory curtain rising over the green New Arrival.
    gsap.fromTo(
      root.current,
      { clipPath: "inset(6% 5% 0% 5%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 20%", scrub: true },
      },
    );

    // Pieces drift at slightly different speeds; media moves within its frame.
    q("[data-piece]").forEach((piece, i) => {
      gsap.fromTo(
        piece,
        { y: [60, 140, 40, 110][i] },
        { y: -[60, 140, 40, 110][i], ease: "none", scrollTrigger: { trigger: piece, start: "top bottom", end: "bottom top", scrub: true } },
      );
      const inner = piece.querySelector("[data-media-inner]");
      if (inner)
        gsap.fromTo(inner, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: piece, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }, root);

  return (
    <section ref={root} className={styles.section} id="most-wanted" data-nav-theme="light" aria-label="Most wanted">
      <header className={styles.header}>
        <SectionMarker index="06" label="Most Wanted" />
        <SplitText text={"The pieces\nasked for *by name*"} className={`t-display ${styles.heading}`} />
        <p className={styles.lede}>
          Four watches that define their houses — and our waiting list. Each is available to view privately at the
          boutique.
        </p>
      </header>

      <ol className={styles.grid}>
        {PIECES.map((w, i) => (
          <li key={w.id} className={`${styles.piece} ${styles[`p${i + 1}`]}`} data-piece>
            <Link href={w.href} prefetch={false} className={styles.link}>
              <MediaSlot
                tone={w.tone}
                ratio={RATIOS[i]}
                image={w.image}
                alt={`${w.brand} ${w.model}`}
                interactive
                motif="stage"
                hint="Photography"
                sizes="(max-width: 767px) 100vw, 50vw"
                className={styles.media}
              >
                <span className={styles.discover} aria-hidden>
                  Discover <span>→</span>
                </span>
              </MediaSlot>
              <div className={styles.caption}>
                <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                <div className={styles.names}>
                  <p className={styles.brand}>{w.brand}</p>
                  <h3 className={`t-display ${styles.model}`}>{w.model}</h3>
                </div>
                <p className={styles.meta}>
                  <span>Ref. {w.reference}</span>
                  <span>{formatPrice(w.price)}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
