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

/** A member signed in on this device (no server yet: kept locally, the password only as a hash). */
export type Member = { name: string; email: string; passwordHash: string };

type AccountState = {
  member?: Member | null;
  signedIn?: boolean;
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

/* ------------------------------------------------------------- membership */

async function hash(text: string) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Sign up: the member is stored on this device and signed in. */
export async function signUp(name: string, email: string, password: string) {
  const member = { name, email: email.trim().toLowerCase(), passwordHash: await hash(password) };
  update((s) => ({ ...s, member, signedIn: true, profile: s.profile ?? { name, email: member.email, phone: "" } }));
}

/** Sign in: returns an error message, or null when it worked. */
export async function signIn(email: string, password: string) {
  const m = store.get().member;
  if (!m || m.email !== email.trim().toLowerCase()) return "Bu e-posta ile kayıtlı bir üyelik bulunamadı.";
  if (m.passwordHash !== (await hash(password))) return "Şifre hatalı.";
  update((s) => ({ ...s, signedIn: true }));
  return null;
}

export const signOut = () => update((s) => ({ ...s, signedIn: false }));
