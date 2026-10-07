"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
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
const RISE = [140, 340];

/**
 * Two large tiles under the brands: the women's watches (/kadin) and the
 * men's (/erkek). As the page scrolls them in they rise into place with the
 * scroll, the second trailing the first, and the photographs settle inside
 * their rounded frames.
 */
export function GenderTiles() {
  const root = useRef<HTMLUListElement>(null);
  useGsap(() => {
    if (prefersReducedMotion()) return;
    const items = gsap.utils.toArray<HTMLElement>("li", root.current);
    items.forEach((li, i) => {
      const scroll = { trigger: root.current, start: "top bottom", end: "top 25%", scrub: 0.6 };
      gsap.fromTo(li, { y: RISE[i] ?? RISE[RISE.length - 1] }, { y: 0, ease: "none", scrollTrigger: scroll });
      const photo = li.querySelector("img");
      if (photo) gsap.fromTo(photo, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: scroll });
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
