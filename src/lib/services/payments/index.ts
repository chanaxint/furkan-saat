import { BANK, BOUTIQUE } from "@/lib/data/site";
import type { Order } from "@/lib/services/account";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/services/enquiries";

/**
 * Payment. Checkout only talks to this module: it lists the methods and asks
 * the chosen provider to start a payment. To accept cards, add a provider
 * here (iyzico, Stripe, Shopier…) whose `start` creates the payment on the
 * server and returns `{ status: "redirect", url }` — the UI needs no change.
 */

export type PaymentResult =
  | { status: "paid" }
  | { status: "redirect"; url: string }
  | { status: "awaiting"; title: string; steps: string[]; action?: { label: string; href: string } };

export type PaymentProvider = {
  id: string;
  label: string;
  description: string;
  start: (order: Order) => Promise<PaymentResult>;
};

const summary = (o: Order) =>
  [
    `Sipariş no: ${o.id}`,
    ...o.items.map((i) => `${i.reference ? `${i.name} — ${i.reference}` : i.name} (${formatPrice(i.price, o.currency)})`),
    `Toplam: ${formatPrice(o.total, o.currency)}`,
    `Teslimat: ${o.delivery.method === "butik" ? "Butikten teslim" : "Sigortalı kargo"}`,
    `Ad soyad: ${o.customer.name}`,
  ].join("\n");

const bankTransfer: PaymentProvider = {
  id: "havale",
  label: "Banka havalesi / EFT",
  description: "Siparişiniz 48 saat sizin için ayrılır; ödeme ulaştığında hazırlanır.",
  start: async (o) => ({
    status: "awaiting",
    title: "Havale bilgileri",
    steps: [
      `Alıcı: ${BANK.holder}`,
      `Banka: ${BANK.bank}`,
      `IBAN: ${BANK.iban}`,
      `Tutar: ${formatPrice(o.total, o.currency)}`,
      `Açıklama: ${o.id}`,
    ],
    action: { label: "Dekontu WhatsApp ile iletin", href: whatsappUrl(`Merhaba, havale dekontumu iletiyorum.\n\n${summary(o)}`) },
  }),
};

const advisor: PaymentProvider = {
  id: "danisman",
  label: "Danışmanla ödeme",
  description: "Kredi kartı, butikte ödeme ya da takas — danışmanımız sizinle birlikte planlar.",
  start: async (o) => ({
    status: "awaiting",
    title: "Danışmanınız sizi arayacak",
    steps: [`${BOUTIQUE.hours}.`, "Siparişinizi aşağıdaki bağlantıyla iletirseniz süreç hemen başlar."],
    action: { label: "Siparişi WhatsApp ile iletin", href: whatsappUrl(`Merhaba, siparişim için ödeme planlamak istiyorum.\n\n${summary(o)}`) },
  }),
};

export const PAYMENT_PROVIDERS: PaymentProvider[] = [bankTransfer, advisor];

export const getProvider = (id: string) => PAYMENT_PROVIDERS.find((p) => p.id === id) ?? advisor;

export const startPayment = (order: Order) => getProvider(order.payment).start(order);
