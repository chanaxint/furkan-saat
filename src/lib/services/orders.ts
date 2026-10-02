"use client";

import type { Product } from "@/lib/data/types";
import { addOrder, type Order } from "./account";
import { brandName } from "./catalog";

/**
 * Orders. Today an order is recorded in the customer's account on this device
 * and the payment provider explains the next step; with a backend, `placeOrder`
 * becomes a server call that also reserves stock and sends the e-mails.
 */

const orderNumber = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `FS-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export function placeOrder(input: Omit<Order, "id" | "createdAt" | "status" | "items" | "total" | "currency">, products: Product[]): Order {
  const items = products.map((p) => ({
    slug: p.slug,
    name: `${brandName(p.brand)} ${p.model}`,
    reference: p.reference,
    price: p.price ?? 0,
  }));
  const order: Order = {
    ...input,
    id: orderNumber(),
    createdAt: new Date().toISOString(),
    status: "Ödeme bekleniyor",
    items,
    currency: products[0]?.currency ?? "EUR",
    total: items.reduce((s, i) => s + i.price, 0),
  };
  addOrder(order);
  return order;
}
