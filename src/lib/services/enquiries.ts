import { BOUTIQUE } from "@/lib/data/site";
import type { Product } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { brandName } from "./catalog";

/**
 * Enquiries. For now every request is handed to WhatsApp or e-mail with a
 * prepared message; a form endpoint or CRM can replace these functions later.
 */

const SITE = "https://furkansaat.com";

const describe = (p: Product) =>
  `${brandName(p.brand)} ${p.model} — Ref. ${p.reference} (${formatPrice(p.price, p.currency)})\n${SITE}/saat/${p.slug}`;

export const whatsappUrl = (message: string) =>
  `https://wa.me/${BOUTIQUE.whatsapp}?text=${encodeURIComponent(message)}`;

export const mailtoUrl = (subject: string, body: string) =>
  `mailto:${BOUTIQUE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const productEnquiry = (p: Product) => ({
  whatsapp: whatsappUrl(`Merhaba, bu saat hakkında bilgi almak istiyorum:\n${describe(p)}`),
  email: mailtoUrl(
    `${brandName(p.brand)} ${p.model} — Ref. ${p.reference}`,
    `Merhaba,\n\nBu saat hakkında bilgi almak istiyorum:\n${describe(p)}\n\nTeşekkürler.`,
  ),
});

/** Hands a cart to an advisor, who confirms availability and arranges payment. */
export const orderEnquiry = (products: Product[]) =>
  whatsappUrl(
    `Merhaba, aşağıdaki saat(ler)i satın almak istiyorum:\n\n${products.map(describe).join("\n\n")}`,
  );
