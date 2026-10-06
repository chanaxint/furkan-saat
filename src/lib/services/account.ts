"use client";

import type { Currency } from "@/lib/data/types";
import type { EnquiryRequest } from "./enquiries";
import { createLocalStore } from "./localStore";

/**
 * What this browser remembers for checkout and requests: contact details,
 * delivery addresses, orders placed here and appointment requests. Membership
 * itself (sign-in, profile, saved addresses, order history, favourites) lives
 * in Supabase — see components/providers/AuthProvider and services/customer.
 */

export type Profile = { name: string; email: string; phone: string };

export type Address = {
  id: string;
  label: string;
  line: string;
  district: string;
  city: string;
  postcode: string;
};

export type OrderStatus = "Ödeme bekleniyor" | "Hazırlanıyor" | "Gönderildi" | "Teslim edildi" | "İptal edildi";

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: { slug: string; name: string; reference: string; price: number }[];
  currency: Currency;
  total: number;
  customer: Profile;
  delivery: { method: "kargo" | "butik"; address?: Omit<Address, "id" | "label"> };
  /** PaymentMethodId — see services/payments. */
  payment: string;
  note?: string;
};

export type StoredRequest = EnquiryRequest & { id: string; createdAt: string };

type AccountState = {
  profile: Profile | null;
  addresses: Address[];
  orders: Order[];
  requests: StoredRequest[];
};

const store = createLocalStore<AccountState>("furkan-saat:account", {
  profile: null,
  addresses: [],
  orders: [],
  requests: [],
});

const update = (fn: (s: AccountState) => AccountState) => store.set(fn(store.get()));
const newId = () => Math.random().toString(36).slice(2, 10);

export function useAccount() {
  return store.useStore();
}

export const saveProfile = (profile: Profile) => update((s) => ({ ...s, profile }));

export const saveAddress = (a: Omit<Address, "id">) => {
  const address = { ...a, id: newId() };
  update((s) => ({ ...s, addresses: [...s.addresses, address] }));
  return address;
};
export const removeAddress = (id: string) => update((s) => ({ ...s, addresses: s.addresses.filter((a) => a.id !== id) }));

export const addOrder = (order: Order) => update((s) => ({ ...s, orders: [order, ...s.orders] }));
export const findOrder = (id: string) => store.get().orders.find((o) => o.id === id) ?? null;

export const recordRequest = (r: EnquiryRequest) =>
  update((s) => ({ ...s, requests: [{ ...r, id: newId(), createdAt: new Date().toISOString() }, ...s.requests] }));
