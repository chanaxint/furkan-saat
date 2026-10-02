"use client";

import type { Currency } from "@/lib/data/types";
import type { EnquiryRequest } from "./enquiries";
import { createLocalStore } from "./localStore";

/**
 * The customer account. Until sign-in exists it lives on this device: the
 * profile, saved addresses, orders and requests are kept in the browser.
 * When accounts move to a server (e.g. Supabase), replace the store calls in
 * this file; the pages use only the hook and functions exported here.
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
