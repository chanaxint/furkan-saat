"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AVAILABILITY, type Product } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { putJson } from "./api";
import { useStatus } from "./useStatus";
import styles from "./admin.module.css";

/** Every watch with its stock state; availability and "featured" save on change. */
export function InventoryTable({ products, brands }: { products: Product[]; brands: Record<string, string> }) {
  const router = useRouter();
  const status = useStatus();

  const update = async (p: Product, patch: Partial<Product>) => {
    try {
      await putJson("/api/yonetim/urunler", { product: { ...p, ...patch } });
      status.show("Kaydedildi.");
      router.refresh();
    } catch (e) {
      status.show((e as Error).message, true);
    }
  };

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>Saat</th>
            <th>Fiyat</th>
            <th>Bulunabilirlik</th>
            <th>Ana sayfada</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.slug}>
              <td>
                {p.images[0] ? <img src={p.images[0]} alt="" className={styles.thumb} /> : <span className={styles.thumb} />}
              </td>
              <td>
                <p className={styles.muted}>{brands[p.brand] ?? p.brand}</p>
                <p className={styles.name}>{p.model}</p>
                <p className={styles.muted}>Ref. {p.reference}</p>
              </td>
              <td>{formatPrice(p.price, p.currency)}</td>
              <td>
                <select
                  className={styles.select}
                  value={p.availability}
                  onChange={(e) => update(p, { availability: e.target.value as Product["availability"] })}
                  aria-label={`${p.model} bulunabilirlik`}
                >
                  {AVAILABILITY.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={!!p.featured}
                  onChange={(e) => update(p, { featured: e.target.checked })}
                  aria-label={`${p.model} ana sayfada`}
                />
              </td>
              <td>
                <Link href={`/yonetim/urunler/${p.slug}`} className={styles.link}>
                  Düzenle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {status.node}
    </div>
  );
}
