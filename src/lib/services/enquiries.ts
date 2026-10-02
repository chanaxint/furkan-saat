import { BOUTIQUE } from "@/lib/data/site";
import type { Product } from "@/lib/data/types";
import { formatPrice, watchLabel } from "@/lib/format";
import { brandName } from "./catalog";

/**
 * Enquiries. For now every request is handed to WhatsApp or e-mail with a
 * prepared message; a form endpoint or CRM can replace these functions later.
 */

const SITE = "https://furkansaat.com";

const describe = (p: Product) =>
  `${watchLabel(brandName(p.brand), p.model, p.reference)} (${formatPrice(p.price, p.currency)})\n${SITE}/saat/${p.slug}`;

export const whatsappUrl = (message: string) =>
  `https://wa.me/${BOUTIQUE.whatsapp}?text=${encodeURIComponent(message)}`;

export const mailtoUrl = (subject: string, body: string) =>
  `mailto:${BOUTIQUE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const productEnquiry = (p: Product) => ({
  whatsapp: whatsappUrl(`Merhaba, bu saat hakkında bilgi almak istiyorum:\n${describe(p)}`),
  email: mailtoUrl(
    watchLabel(brandName(p.brand), p.model, p.reference),
    `Merhaba,\n\nBu saat hakkında bilgi almak istiyorum:\n${describe(p)}\n\nTeşekkürler.`,
  ),
});

/* -------------------------------------------------------------- requests */

export type EnquiryKind = "ozel-gosterim" | "degerleme" | "takas";

/** A completed form: what it is, the answers in reading order, and who sent it. */
export type EnquiryRequest = {
  kind: EnquiryKind;
  /** e.g. "Özel gösterim talebi" */
  title: string;
  /** Label / value pairs; empty values are left out of the message. */
  fields: [string, string][];
  /** Number of photographs the customer chose (sent separately for now). */
  photos?: number;
};

/**
 * What happened to a request. `handoff`: no server yet — the prepared message
 * opens in WhatsApp or e-mail and the customer sends it. `received`: a backend
 * stored it (when one is connected, return this and the forms say so).
 */
export type EnquiryResult =
  | { status: "handoff"; whatsapp: string; email: string }
  | { status: "received" };

const compose = (r: EnquiryRequest) => {
  const lines = r.fields.filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v}`);
  if (r.photos) lines.push(`Fotoğraf: ${r.photos} adet — bu mesajın ardından ekleyeceğim.`);
  return `Merhaba, ${r.title.toLocaleLowerCase("tr")} göndermek istiyorum.\n\n${lines.join("\n")}`;
};

/**
 * Sends a request. Today it prepares the WhatsApp and e-mail hand-off; replace
 * the body with a call to a form endpoint or CRM and the forms keep working.
 */
export async function submitEnquiry(r: EnquiryRequest): Promise<EnquiryResult> {
  const text = compose(r);
  return { status: "handoff", whatsapp: whatsappUrl(text), email: mailtoUrl(r.title, text) };
}
