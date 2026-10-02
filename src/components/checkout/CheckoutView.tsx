"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChoiceField, FieldGroup, PhoneField, TextArea, TextField } from "@/components/forms/fields";
import { Form } from "@/components/forms/Form";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { ButtonLink } from "@/components/ui/Button";
import { saveAddress, saveProfile, useAccount } from "@/lib/services/account";
import { brandName } from "@/lib/services/catalog";
import { useCart } from "@/lib/services/cart";
import { refLabel } from "@/lib/format";
import { placeOrder } from "@/lib/services/orders";
import { PAYMENT_PROVIDERS, startPayment } from "@/lib/services/payments";
import styles from "./CheckoutView.module.css";

const NEW = "yeni";

/**
 * Checkout on one page: 01 contact, 02 delivery, 03 payment, with the order
 * summary beside it. Saved details on this device are filled in.
 */
export function CheckoutView() {
  const cart = useCart();
  const account = useAccount();
  const router = useRouter();
  const [delivery, setDelivery] = useState<"kargo" | "butik">("kargo");
  const [addressChoice, setAddressChoice] = useState<string>();

  if (!cart.items.length)
    return (
      <div className={`container ${styles.empty}`}>
        <p className={styles.emptyTitle}>Sepetiniz boş.</p>
        <ButtonLink href="/koleksiyon">Koleksiyonu keşfedin</ButtonLink>
      </div>
    );

  const saved = account.addresses;
  const chosen = addressChoice ?? (saved[0]?.id || NEW);
  const p = account.profile;

  const onValid = async (d: FormData) => {
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const remember = d.get("remember") === "on";
    const customer = { name: get("name"), email: get("email"), phone: get("phone") };
    let address;
    if (delivery === "kargo") {
      const s = saved.find((a) => a.id === chosen);
      address = s
        ? { line: s.line, district: s.district, city: s.city, postcode: s.postcode }
        : { line: get("line"), district: get("district"), city: get("city"), postcode: get("postcode") };
      if (!s && remember) saveAddress({ label: "Teslimat adresi", ...address });
    }
    if (remember) saveProfile(customer);
    const order = placeOrder(
      { customer, delivery: { method: delivery, address }, payment: get("payment"), note: get("note") || undefined },
      cart.items.map((i) => i.product),
    );
    const result = await startPayment(order);
    if (result.status === "redirect") {
      window.location.href = result.url;
      return;
    }
    cart.clear();
    router.push(`/odeme/tamamlandi?no=${order.id}`);
  };

  return (
    <div className={`container ${styles.layout}`}>
      {/* Remount once saved details have loaded, so they appear as defaults. */}
      <Form
        key={p?.email ?? "guest"}
        onValid={onValid}
        submitLabel="Siparişi onaylayın"
        note="Siparişi onayladığınızda ödeme adımına geçersiniz; saat bu süre boyunca sizin için ayrılır."
      >
        <FieldGroup title="01 — İletişim">
          <TextField name="name" label="Ad soyad" required autoComplete="name" defaultValue={p?.name} wide />
          <TextField name="email" label="E-posta" type="email" required autoComplete="email" defaultValue={p?.email} />
          <PhoneField name="phone" required defaultValue={p?.phone} />
        </FieldGroup>

        <FieldGroup title="02 — Teslimat">
          <ChoiceField
            name="delivery"
            label="Teslimat yöntemi"
            required
            wide
            value={delivery}
            onChange={(v) => setDelivery(v as "kargo" | "butik")}
            options={[
              { value: "kargo", label: "Sigortalı kargo · ücretsiz" },
              { value: "butik", label: "Butikten teslim alacağım" },
            ]}
          />
          {delivery === "kargo" && saved.length > 0 && (
            <ChoiceField
              name="address"
              label="Adres"
              required
              wide
              value={chosen}
              onChange={setAddressChoice}
              options={[...saved.map((a) => ({ value: a.id, label: `${a.line}, ${a.district}/${a.city}` })), { value: NEW, label: "Yeni adres" }]}
            />
          )}
          {delivery === "kargo" && chosen === NEW && (
            <>
              <TextField name="line" label="Adres" required autoComplete="street-address" wide />
              <TextField name="district" label="İlçe" required />
              <TextField name="city" label="İl" required autoComplete="address-level1" />
              <TextField name="postcode" label="Posta kodu" inputMode="numeric" autoComplete="postal-code" />
            </>
          )}
          {delivery === "butik" && (
            <p className={styles.notice}>
              Saatiniz hazır olduğunda sizi arayıp butikte, size uygun bir saatte teslim randevusu belirleriz.
            </p>
          )}
        </FieldGroup>

        <FieldGroup title="03 — Ödeme">
          <fieldset className={styles.payments}>
            <legend className="visually-hidden">Ödeme yöntemi</legend>
            {PAYMENT_PROVIDERS.map((m, i) => (
              <label key={m.id} className={styles.payment}>
                <input type="radio" name="payment" value={m.id} required defaultChecked={i === 0} />
                <span className={styles.paymentText}>
                  <span className={styles.paymentLabel}>{m.label}</span>
                  <span className={styles.paymentDescription}>{m.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <TextArea name="note" label="Sipariş notu" placeholder="Hediye paketi, teslimat saati…" />
          <label className={styles.remember}>
            <input type="checkbox" name="remember" defaultChecked />
            <span>Bilgilerimi bir sonraki siparişim için bu cihazda saklayın.</span>
          </label>
        </FieldGroup>
      </Form>

      <aside className={styles.summary} aria-label="Sipariş özeti">
        <p className={styles.label}>Sipariş özeti</p>
        <ul className={styles.lines}>
          {cart.items.map(({ product: item }) => (
            <li key={item.slug} className={styles.line}>
              <span className={styles.thumb}>
                <Image src={item.images[0]} alt="" fill sizes="72px" />
              </span>
              <span className={styles.lineText}>
                <span className={styles.brand}>{brandName(item.brand)}</span>
                <span className={styles.model}>{item.model}</span>
                {item.reference && <span className={styles.ref}>{refLabel(item.reference)}</span>}
              </span>
              <PriceDisplay price={item.price} currency={item.currency} className={styles.price} />
            </li>
          ))}
        </ul>
        <dl className={styles.totals}>
          <div>
            <dt>Ara toplam</dt>
            <dd>
              <PriceDisplay price={cart.subtotal} currency={cart.currency} />
            </dd>
          </div>
          <div>
            <dt>Teslimat</dt>
            <dd>Ücretsiz</dd>
          </div>
          <div className={styles.total}>
            <dt>Toplam</dt>
            <dd>
              <PriceDisplay price={cart.subtotal} currency={cart.currency} />
            </dd>
          </div>
        </dl>
        <Link href="/sepet" className={styles.back}>
          Sepete dön
        </Link>
      </aside>
    </div>
  );
}
