"use client";

import Image from "next/image";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import styles from "./GenderTiles.module.css";

const TILES = [
  { value: "kadin", label: "Kadın", image: "/assets/images/watches/freelook-baget-tasli-yesil.webp", alt: "Elde tutulan, taşlı çerçeveli yeşil kadranlı bicolor kadın saati" },
  { value: "erkek", label: "Erkek", image: "/assets/images/watches/daniel-klein-exclusive-yesil-altin.webp", alt: "Elde tutulan, yeşil kadranlı altın kasalı deri kayışlı erkek saati" },
];

/**
 * Two large tiles under the brands, women's and men's watches: a click opens
 * the collection already filtered (CatalogView listens for "catalog:filter",
 * and reads ?cinsiyet= when the page is opened from a link).
 */
export function GenderTiles() {
  const { scrollTo } = useSmoothScroll();
  return (
    <ul className={styles.grid}>
      {TILES.map((t) => (
        <li key={t.value}>
          <a
            href={`/?cinsiyet=${t.value}#koleksiyon`}
            className={styles.tile}
            onClick={(e) => {
              if (window.location.pathname !== "/") return;
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("catalog:filter", { detail: { gender: t.value } }));
              scrollTo("#koleksiyon");
            }}
          >
            <Image src={t.image} alt={t.alt} fill sizes="(max-width: 767px) 100vw, 50vw" className={styles.photo} />
            <span className={styles.shade} aria-hidden />
            {/* The name over the top of the photograph, the invitation at its foot. */}
            <span className={styles.name}>{t.label}</span>
            <span className={styles.cta}>Keşfedin</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
