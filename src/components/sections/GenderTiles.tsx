"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import styles from "./GenderTiles.module.css";

const TILES = [
  {
    value: "kadin",
    label: "Kadın",
    image: "/assets/images/gender-kadin.webp",
    focus: "50% 45%",
    alt: "Ahşap panelli bir kafede, bileğinde sedef kadranlı taşlı rose altın saatle oturan kadın",
  },
  {
    value: "erkek",
    label: "Erkek",
    image: "/assets/images/gender-erkek.webp",
    // His head and the watch on his wrist both in the frame.
    focus: "50% 22%",
    alt: "Akdeniz'e bakan bir villa terasında, bileğinde lacivert kadranlı bicolor kronografla korkuluğa yaslanan adam",
  },
];

/** How far below its place each tile starts (px), the second further, so it trails the first. */
const RISE = [160, 300];

/**
 * Two large tiles under the brands: the women's watches (/kadin) and the
 * men's (/erkek). When the page brings them in (scrolling down) they rise
 * into place, the second trailing the first. Only on the way in: scrolling back up leaves them
 * as they are; once they are out of sight below, they are set back, ready to
 * come in again next time.
 */
export function GenderTiles() {
  const root = useRef<HTMLUListElement>(null);
  useGsap(() => {
    if (prefersReducedMotion()) return;
    const items = gsap.utils.toArray<HTMLElement>("li", root.current);
    // Straight in: no fade and no soft zoom, the photographs sharp from the first frame.
    const away = () => items.forEach((li, i) => gsap.set(li, { y: RISE[i] ?? RISE[RISE.length - 1] }));
    away();
    const tl = gsap.timeline({ paused: true }).to(items, { y: 0, duration: 1.1, ease: "power3.out", stagger: 0.15 }, 0);
    // In: as the tiles' top passes 85% of the screen, scrolling down.
    const into = ScrollTrigger.create({ trigger: root.current, start: "top 85%", onEnter: () => tl.restart() });
    // Opened already below that point (a reload, the back button): simply in place.
    if (window.scrollY > into.start) tl.progress(1);
    // Set back only once they are wholly below the screen again (scrolled back up past them).
    ScrollTrigger.create({
      trigger: root.current,
      start: "top bottom",
      onLeaveBack: () => {
        tl.pause(0);
        away();
      },
    });
  }, root);
  return (
    <ul ref={root} className={styles.grid}>
      {TILES.map((t) => (
        <li key={t.value}>
          <Link href={`/${t.value}`} className={styles.tile}>
            <Image src={t.image} alt={t.alt} fill sizes="(max-width: 767px) 100vw, 50vw" className={styles.photo} style={{ objectPosition: t.focus }} />
            <span className={styles.shade} aria-hidden />
            {/* The name over the top of the photograph, the invitation at its foot. */}
            <span className={styles.name}>{t.label}</span>
            <span className={styles.cta}>Keşfedin</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
