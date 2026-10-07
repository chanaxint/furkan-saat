import Image from "next/image";
import Link from "next/link";
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

/** Two large tiles under the brands: the women's watches (/kadin) and the men's (/erkek). */
export function GenderTiles() {
  return (
    <ul className={styles.grid}>
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
