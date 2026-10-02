import type { Product } from "@/lib/data/types";
import styles from "./ProductSpecs.module.css";

/** Labels for the technical rows, in display order. Rows without a value are skipped. */
export const SPEC_ROWS: { label: string; value: (p: Product) => string | undefined }[] = [
  { label: "Mekanizma", value: (p) => p.specs.movement },
  { label: "Kalibre", value: (p) => p.specs.caliber },
  { label: "Güç rezervi", value: (p) => p.specs.powerReserve },
  { label: "Kasa çapı", value: (p) => p.specs.caseDiameter },
  { label: "Kasa malzemesi", value: (p) => p.specs.caseMaterial },
  { label: "Cam", value: (p) => p.specs.crystal },
  { label: "Su geçirmezlik", value: (p) => p.specs.waterResistance },
  { label: "Kordon / bilezik", value: (p) => p.specs.strap },
  { label: "Yıl", value: (p) => p.specs.year },
  { label: "Durum", value: (p) => p.condition },
  { label: "Kutu ve belgeler", value: (p) => (p.fullSet ? "Mevcut" : "Yok") },
];

export function ProductSpecs({ product }: { product: Product }) {
  return (
    <dl className={styles.specs}>
      {SPEC_ROWS.map(({ label, value }) => {
        const v = value(product);
        return v ? (
          <div key={label} className={styles.row}>
            <dt>{label}</dt>
            <dd>{v}</dd>
          </div>
        ) : null;
      })}
    </dl>
  );
}
