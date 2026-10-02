"use client";

import Link from "next/link";
import { FieldGroup, PhoneField, TextField } from "@/components/forms/fields";
import { Form } from "@/components/forms/Form";
import { Button, ButtonLink } from "@/components/ui/Button";
import { removeAddress, saveAddress, saveProfile, useAccount } from "@/lib/services/account";
import { formatDate, formatPrice } from "@/lib/format";
import { getProvider } from "@/lib/services/payments";
import { useState } from "react";
import styles from "./AccountViews.module.css";

function Empty({ title, text, href, cta }: { title: string; text?: string; href: string; cta: string }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      {text && <p className={styles.emptyText}>{text}</p>}
      <ButtonLink href={href}>{cta}</ButtonLink>
    </div>
  );
}

export function OrdersView() {
  const { orders } = useAccount();
  if (!orders.length) return <Empty title="Henüz siparişiniz yok." href="/koleksiyon" cta="Koleksiyonu keşfedin" />;
  return (
    <ul className={styles.records}>
      {orders.map((o) => (
        <li key={o.id} className={styles.record}>
          <div className={styles.recordHead}>
            <p className={styles.recordTitle}>{o.id}</p>
            <p className={styles.status}>{o.status}</p>
          </div>
          <p className={styles.muted}>
            {formatDate(o.createdAt.slice(0, 10))} · {getProvider(o.payment).label} · {formatPrice(o.total, o.currency)}
          </p>
          <p className={styles.recordBody}>{o.items.map((i) => i.name).join(", ")}</p>
          <Link href={`/odeme/tamamlandi?no=${o.id}`} className={styles.link}>
            Ayrıntılar ve ödeme bilgileri
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RequestsView() {
  const { requests } = useAccount();
  if (!requests.length)
    return (
      <Empty
        title="Henüz bir talebiniz yok."
        text="Özel gösterim, değerleme ve takas talepleriniz burada listelenir."
        href="/ozel-gosterim"
        cta="Randevu talep edin"
      />
    );
  return (
    <ul className={styles.records}>
      {requests.map((r) => (
        <li key={r.id} className={styles.record}>
          <div className={styles.recordHead}>
            <p className={styles.recordTitle}>{r.title}</p>
            <p className={styles.muted}>{formatDate(r.createdAt.slice(0, 10))}</p>
          </div>
          <dl className={styles.answers}>
            {r.fields
              .filter(([, v]) => v)
              .slice(0, 6)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function AddressesView() {
  const { addresses } = useAccount();
  const [adding, setAdding] = useState(false);
  return (
    <div className={styles.stack}>
      {addresses.length > 0 && (
        <ul className={styles.records}>
          {addresses.map((a) => (
            <li key={a.id} className={styles.record}>
              <div className={styles.recordHead}>
                <p className={styles.recordTitle}>{a.label}</p>
                <button className={styles.link} onClick={() => removeAddress(a.id)}>
                  Sil
                </button>
              </div>
              <p className={styles.recordBody}>
                {a.line}, {a.district}/{a.city} {a.postcode}
              </p>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <Form
          submitLabel="Adresi kaydedin"
          onValid={(d) => {
            const get = (k: string) => String(d.get(k) ?? "").trim();
            saveAddress({ label: get("label") || "Adres", line: get("line"), district: get("district"), city: get("city"), postcode: get("postcode") });
            setAdding(false);
          }}
        >
          <FieldGroup title="Yeni adres">
            <TextField name="label" label="Adres adı" placeholder="Ev, ofis…" wide />
            <TextField name="line" label="Adres" required autoComplete="street-address" wide />
            <TextField name="district" label="İlçe" required />
            <TextField name="city" label="İl" required />
            <TextField name="postcode" label="Posta kodu" inputMode="numeric" />
          </FieldGroup>
        </Form>
      ) : (
        <div>
          {!addresses.length && <p className={styles.emptyTitle}>Kayıtlı adresiniz yok.</p>}
          <Button onClick={() => setAdding(true)} className={styles.add}>
            Adres ekleyin
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProfileView() {
  const { profile } = useAccount();
  const [saved, setSaved] = useState(false);
  return (
    <Form
      key={profile?.email ?? "empty"}
      submitLabel="Kaydedin"
      note={saved ? "Bilgileriniz kaydedildi." : "Bilgileriniz ödeme sırasında otomatik doldurulur."}
      onValid={(d) => {
        saveProfile({ name: String(d.get("name")), email: String(d.get("email")), phone: String(d.get("phone")) });
        setSaved(true);
      }}
    >
      <FieldGroup title="Profil">
        <TextField name="name" label="Ad soyad" required autoComplete="name" defaultValue={profile?.name} wide />
        <TextField name="email" label="E-posta" type="email" required autoComplete="email" defaultValue={profile?.email} />
        <PhoneField name="phone" required defaultValue={profile?.phone} />
      </FieldGroup>
    </Form>
  );
}
