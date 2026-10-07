import Image from "next/image";
import Link from "next/link";
import styles from "./GenderTiles.module.css";

const TILES = [
  { value: "kadin", label: "Kadın", image: "/assets/images/watches/freelook-baget-tasli-yesil.webp", alt: "Elde tutulan, taşlı çerçeveli yeşil kadranlı bicolor kadın saati" },
  { value: "erkek", label: "Erkek", image: "/assets/images/watches/daniel-klein-exclusive-yesil-altin.webp", alt: "Elde tutulan, yeşil kadranlı altın kasalı deri kayışlı erkek saati" },
];

/** Two large tiles under the brands: the women's watches (/kadin) and the men's (/erkek). */
export function GenderTiles() {
  return (
    <ul className={styles.grid}>
      {TILES.map((t) => (
        <li key={t.value}>
          <Link href={`/${t.value}`} className={styles.tile}>
            <Image src={t.image} alt={t.alt} fill sizes="(max-width: 767px) 100vw, 50vw" className={styles.photo} />
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
