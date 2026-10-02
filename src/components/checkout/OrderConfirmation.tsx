"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { findOrder, useAccount, type Order } from "@/lib/services/account";
import { formatDate, formatPrice, refLabel } from "@/lib/format";
import { getProvider, startPayment, type PaymentResult } from "@/lib/services/payments";
import styles from "./OrderConfirmation.module.css";

/** After checkout (and from the account's order list): the order and its next step. */
export function OrderConfirmation() {
  useAccount(); // re-render once the account has loaded
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [next, setNext] = useState<PaymentResult | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("no") ?? "";
    const o = findOrder(id);
    setOrder(o);
    if (o) startPayment(o).then(setNext);
  }, []);

  if (order === undefined) return null;
  if (order === null)
    return (
      <div className={`container ${styles.wrap}`}>
        <p className={styles.title}>Sipariş bulunamadı.</p>
        <p className={styles.muted}>Siparişleriniz, verildikleri cihazdaki hesabınızda görünür.</p>
        <ButtonLink href="/hesap">Siparişlerim</ButtonLink>
      </div>
    );

  return (
    <div className={`container ${styles.wrap}`}>
      <p className={`rise ${styles.eyebrow}`}>Sipariş {order.id}</p>
      <h1 className={`t-display rise ${styles.title}`} style={{ "--i": 1 } as React.CSSProperties}>
        Teşekkür <em>ederiz.</em>
      </h1>
      <p className={`rise ${styles.muted}`} style={{ "--i": 2 } as React.CSSProperties}>
        {formatDate(order.createdAt.slice(0, 10))} · {order.status} · {getProvider(order.payment).label}
      </p>

      {next?.status === "awaiting" && (
        <section className={`rise ${styles.next}`} style={{ "--i": 3 } as React.CSSProperties} aria-label="Sonraki adım">
          <p className={styles.label}>{next.title}</p>
          <ul className={styles.steps}>
            {next.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {next.action && (
            <ButtonLink href={next.action.href} external variant="solid">
              {next.action.label}
            </ButtonLink>
          )}
        </section>
      )}

      <section className={styles.items} aria-label="Sipariş özeti">
        <ul>
          {order.items.map((i) => (
            <li key={i.slug}>
              <span>
                {i.name} {i.reference && <span className={styles.muted}>· {refLabel(i.reference)}</span>}
              </span>
              <span>{formatPrice(i.price, order.currency)}</span>
            </li>
          ))}
          <li className={styles.total}>
            <span>Toplam</span>
            <span>{formatPrice(order.total, order.currency)}</span>
          </li>
        </ul>
        <p className={styles.muted}>
          {order.delivery.method === "butik"
            ? "Butikten teslim alınacak."
            : `Teslimat: ${order.delivery.address?.line}, ${order.delivery.address?.district}/${order.delivery.address?.city}`}
        </p>
      </section>

      <div className={styles.links}>
        <ButtonLink href="/hesap">Siparişlerim</ButtonLink>
        <ButtonLink href="/koleksiyon" variant="line">
          Koleksiyona dönün
        </ButtonLink>
      </div>
    </div>
  );
}
