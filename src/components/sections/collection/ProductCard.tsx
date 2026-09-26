import Link from "next/link";
import { MediaSlot } from "@/components/media/MediaSlot";
import { formatPrice } from "@/lib/data/watches";
import type { Watch } from "@/lib/data/types";
import styles from "./ProductCard.module.css";

/** Editorial product entry: large image, quiet type, no card chrome. */
export function ProductCard({ watch, index }: { watch: Watch; index: number }) {
  return (
    <Link href={watch.href} prefetch={false} className={styles.card}>
      <MediaSlot
        tone={watch.tone}
        ratio="4 / 5"
        image={watch.image}
        alt={`${watch.brand} ${watch.model}, referans ${watch.reference}`}
        interactive
        motif="stage"
        hint="Fotoğraf · 4:5"
        sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw"
      >
        <span className={styles.view} aria-hidden>
          İncele
        </span>
      </MediaSlot>
      <div className={styles.info}>
        <div className={styles.row}>
          <p className={styles.brand} lang="en">{watch.brand}</p>
          <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
        </div>
        <h3 className={`t-display ${styles.model}`}>{watch.model}</h3>
        <div className={styles.row}>
          <p className={styles.spec}>
            {watch.material} · {watch.diameter}
          </p>
          <p className={styles.price}>{formatPrice(watch.price)}</p>
        </div>
      </div>
    </Link>
  );
}
