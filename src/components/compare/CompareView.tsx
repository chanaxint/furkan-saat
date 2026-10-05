"use client";

import Image from "next/image";
import Link from "next/link";
import { SelectField } from "@/components/forms/fields";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { SPEC_ROWS } from "@/components/product/ProductSpecs";
import { ButtonLink } from "@/components/ui/Button";
import { PRODUCTS } from "@/lib/data/products";
import type { Product } from "@/lib/data/types";
import { brandName, findProduct } from "@/lib/services/catalog";
import { MAX_COMPARE, useCompare } from "@/lib/services/compare";
import { formatPrice, refLabel, watchLabel } from "@/lib/format";
import styles from "./CompareView.module.css";

/** The rows compared, in reading order: price first, then the specification rows. */
const ROWS: { label: string; value: (p: Product) => string | undefined }[] = [
  { label: "Fiyat", value: (p) => formatPrice(p.price, p.currency) },
  ...SPEC_ROWS.filter((r) => r.label !== "Kutu ve belgeler"),
];

/** Side-by-side comparison: one column per watch, one quiet line per attribute. */
export function CompareView() {
  const compare = useCompare();
  const products = compare.slugs.flatMap((s) => findProduct(s) ?? []);
  const addable = PRODUCTS.filter((p) => !compare.has(p.slug)).map((p) => ({ value: p.slug, label: watchLabel(brandName(p.brand), p.model, p.reference) }));

  const picker = !compare.full && (
    <div className={styles.picker}>
      <SelectField
        name="add"
        label="Saat ekleyin"
        options={addable}
        placeholder="Koleksiyondan bir saat seçin"
        value=""
        onChange={(e) => e.target.value && compare.toggle(e.target.value)}
      />
    </div>
  );

  if (!products.length)
    return (
      <div className={`container ${styles.empty}`}>
        <p className={styles.emptyTitle}>Karşılaştırmak için en fazla {MAX_COMPARE} saat seçin.</p>
        {picker}
        <ButtonLink href="/#koleksiyon" variant="line">
          Koleksiyona göz atın
        </ButtonLink>
      </div>
    );

  return (
    <div className="container">
      <div className={styles.scroller} data-lenis-prevent>
        <table className={styles.table} style={{ "--cols": products.length } as React.CSSProperties}>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Özellik</span>
              </th>
              {products.map((p) => (
                <th key={p.slug} scope="col" className={styles.watch}>
                  <Link href={`/saat/${p.slug}`} className={styles.media}>
                    <Image src={p.images[0]} alt="" fill sizes="(max-width: 640px) 45vw, 22vw" />
                  </Link>
                  <span className={styles.brand}>{brandName(p.brand)}</span>
                  <Link href={`/saat/${p.slug}`} className={styles.model}>
                    {p.model}
                  </Link>
                  {p.reference && <span className={styles.ref}>{refLabel(p.reference)}</span>}
                  <button className={styles.remove} onClick={() => compare.remove(p.slug)}>
                    Çıkar
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {products.map((p) => (
                  <td key={p.slug}>{r.label === "Fiyat" ? <PriceDisplay price={p.price} currency={p.currency} /> : (r.value(p) ?? "—")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {picker}
    </div>
  );
}
