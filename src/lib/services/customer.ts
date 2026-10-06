"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { AddressInput, AddressRow, OrderRow, OrderStatus, ProfileRow } from "@/lib/supabase/types";

/**
 * The signed-in customer's own records in Supabase. Every query runs as the
 * customer: the database's RLS policies return and accept only their rows,
 * whatever is asked here.
 */

const db = () => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("supabase_not_configured");
  return supabase;
};

/** Loads once, then on `reload()`; exposes loading / error / data for the page's states. */
export function useRecord<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<{ data?: T; error?: unknown; loading: boolean }>({ loading: true });
  const [round, setRound] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    load().then(
      (data) => live && setState({ data, loading: false }),
      (error) => live && setState({ error, loading: false }),
    );
    return () => {
      live = false;
    };
  }, [key, round]);
  const reload = useCallback(() => setRound((r) => r + 1), []);
  return { ...state, reload };
}

/* ---------------------------------------------------------------- profile */

export async function fetchProfile() {
  const { data, error } = await db().from("profiles").select("*").single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function updateProfile(fields: { first_name: string; last_name: string; phone: string | null }) {
  const { data: claims } = await db().auth.getClaims();
  const id = claims?.claims?.sub;
  if (!id) throw new Error("not_authenticated");
  const { error } = await db().from("profiles").update(fields).eq("id", id);
  if (error) throw error;
  // Keep the name on the auth user too (shown in e-mails).
  await db().auth.updateUser({ data: { first_name: fields.first_name, last_name: fields.last_name } });
}

/* -------------------------------------------------------------- addresses */

export async function fetchAddresses() {
  const { data, error } = await db()
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as AddressRow[];
}

export async function saveAddress(input: AddressInput, id?: string) {
  const query = id ? db().from("addresses").update(input).eq("id", id) : db().from("addresses").insert(input);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteAddress(id: string) {
  const { error } = await db().from("addresses").delete().eq("id", id);
  if (error) throw error;
}

/** The database keeps exactly one default (trigger addresses_one_default). */
export async function makeDefaultAddress(id: string) {
  const { error } = await db().from("addresses").update({ is_default: true }).eq("id", id);
  if (error) throw error;
}

/* ----------------------------------------------------------------- orders */

export async function fetchOrders() {
  const { data, error } = await db()
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as OrderRow[];
}

/**
 * Places an order for the signed-in customer (database function create_order):
 * prices, names and pictures are taken from the product list on the server and
 * kept with the order; the chosen address is copied into it. For the payment
 * step to call once a provider is connected.
 */
export async function createOrder(items: { slug: string; quantity: number }[], addressId: string | null) {
  const { data, error } = await db().rpc("create_order", { p_items: items, p_address_id: addressId });
  if (error) throw error;
  return data as OrderRow;
}

export const ORDER_STATUS: Record<OrderStatus, string> = {
  pending_payment: "Ödeme bekleniyor",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};
