import "server-only";

import { catalogSource } from "@/lib/catalog/source";
import { PRODUCT_COLUMNS, productWriteFields, rowToProduct } from "@/lib/catalog/rows";
import type { Product } from "@/lib/data/types";
import { brandName } from "@/lib/services/catalog";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminForbidden, deleteProduct, InvalidInput, isFileEditingEnabled, readProducts, saveProduct } from "./store";

/**
 * The watches as the panel reads and writes them, from wherever the catalogue
 * lives (CATALOG_SOURCE):
 *   json — products.json in the project, as before (development only)
 *   db   — public.products, as the signed-in admin: Row Level Security lets
 *          only admins write, so no service role key is needed. "Delete"
 *          retires the watch (is_active = false): customers' favourites and
 *          past order lines keep it.
 * Callers check the admin first (adminRoute / requireAdmin); the database
 * checks again.
 */
export type AdminCatalog = {
  list(): Promise<Product[]>;
  /** Inserts, or replaces the watch at `previous` (its old slug) or at its own slug. */
  save(product: Product, previous?: string): Promise<void>;
  remove(slug: string): Promise<void>;
};

/** Whether the panel can change the watches here: always with the database, with products.json only in development. */
export const isCatalogEditable = () => catalogSource() === "db" || isFileEditingEnabled();

export function adminCatalog(): AdminCatalog {
  return catalogSource() === "db" ? databaseCatalog : fileCatalog;
}

const fileCatalog: AdminCatalog = { list: readProducts, save: saveProduct, remove: deleteProduct };

type DbError = { code?: string; message?: string } | null;

/** A database refusal as the panel's message; anything unexpected stays a server error without details. */
function fail(error: DbError, action: string): never {
  if (error?.code === "23505") throw new InvalidInput("Bu adreste başka bir saat var.");
  if (error?.code === "23514" || error?.code === "22P02") throw new InvalidInput("Saatin bilgilerinden biri geçersiz.");
  if (error?.code === "42501") throw new AdminForbidden();
  console.error(`admin catalogue: ${action} failed`, error?.code ?? "unknown");
  throw new Error(`${action} başarısız oldu.`);
}

async function db() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error("Supabase ayarları eksik.");
  return supabase;
}

const databaseCatalog: AdminCatalog = {
  async list() {
    const { data, error } = await (await db())
      .from("products")
      .select(PRODUCT_COLUMNS.join(","))
      .eq("is_active", true)
      .order("position")
      .order("slug");
    if (error) fail(error, "Ürünleri okuma");
    return (data ?? []).map(rowToProduct);
  },

  async save(product, previous) {
    const supabase = await db();
    const fields = productWriteFields(product, brandName(product.brand));
    const updated = await supabase
      .from("products")
      .update(fields)
      .eq("slug", previous ?? product.slug)
      .select("slug");
    if (updated.error) fail(updated.error, "Kaydetme");
    if (updated.data?.length) return;

    // A new watch goes to the top of the list, as in products.json.
    const first = await supabase.from("products").select("position").order("position").limit(1);
    if (first.error) fail(first.error, "Kaydetme");
    const position = first.data?.length ? Number(first.data[0].position) - 1 : 0;
    const inserted = await supabase
      .from("products")
      .insert({ ...fields, position })
      .select("slug");
    if (inserted.error) fail(inserted.error, "Kaydetme");
    if (!inserted.data?.length) throw new AdminForbidden();
  },

  async remove(slug) {
    const { data, error } = await (await db())
      .from("products")
      .update({ is_active: false })
      .eq("slug", slug)
      .select("slug");
    if (error) fail(error, "Silme");
    if (!data?.length) throw new InvalidInput("Saat bulunamadı.");
  },
};
