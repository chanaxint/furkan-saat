"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckboxField, FieldGroup, PhoneField, TextField } from "@/components/forms/fields";
import { Form } from "@/components/forms/Form";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DATA_ERROR, SAVE_ERROR } from "@/lib/auth/messages";
import { formatDate, formatPrice } from "@/lib/format";
import { useAccount } from "@/lib/services/account";
import {
  deleteAddress,
  fetchAddresses,
  fetchOrders,
  fetchProfile,
  makeDefaultAddress,
  ORDER_STATUS,
  saveAddress,
  updateProfile,
  useRecord,
} from "@/lib/services/customer";
import type { AddressInput, AddressRow } from "@/lib/supabase/types";
import styles from "./AccountViews.module.css"
;

function Empty({ title, text, href, cta }: { title: string; text?: string; href: string; cta: string }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      {text && <p className={styles.emptyText}>{text}</p>}
      <ButtonLink href={href}>{cta}</ButtonLink>
    </div>
  );
}


/** While a record loads: a quiet line, announced to screen readers. */
function Loading({ what }: { what: string }) {
  return (
    <p className={styles.loading} role="status" aria-live="polite">
      {what} yükleniyor…
    </p>
  );
}

/** A load that failed, with a way to try again. */
function Failed({ retry }: { retry: () => void }) {
  return (
    <div className={styles.failed} role="alert">
      <p>{DATA_ERROR}</p>
      <button type="button" className={styles.link} onClick={retry}>
        Tekrar deneyin
      </button>
    </div>
  );
}

const day = (iso: string) => formatDate(iso.slice(0, 10));

/* ---------------------------------------------------------------- Profilim */

export function ProfileView() {
  const { data: profile, error, loading, reload } = useRecord(fetchProfile, "profile");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  if (loading && !profile) return <Loading what="Profiliniz" />;
  if (error || !profile) return <Failed retry={reload} />;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return (
    <div className={styles.stack}>
      {message && (
        <p className={styles.notice} role="status">
          {message}
        </p>
      )}
      <section aria-labelledby="profil-baslik" className={styles.section}>
        <h2 id="profil-baslik" className={styles.sectionTitle}>
          {name ? <>Hoş geldiniz, <em>{profile.first_name}</em></> : "Profilim"}
        </h2>
        {editing ? (
          <Form
            submitLabel="Bilgilerimi kaydet"
            note={failure ?? "E-posta adresiniz giriş bilginizdir ve burada değiştirilemez."}
            onValid={async (d) => {
              const get = (k: string) => String(d.get(k) ?? "").trim();
              setFailure(null);
              try {
                await updateProfile({ first_name: get("first_name"), last_name: get("last_name"), phone: get("phone") || null });
                setEditing(false);
                setMessage("Bilgileriniz kaydedildi.");
                reload();
              } catch {
                setFailure(SAVE_ERROR);
              }
            }}
          >
            <FieldGroup title="Bilgileri düzenle">
              <TextField name="first_name" label="Ad" required autoComplete="given-name" maxLength={80} defaultValue={profile.first_name} />
              <TextField name="last_name" label="Soyad" required autoComplete="family-name" maxLength={80} defaultValue={profile.last_name} />
              <TextField name="email" label="E-posta" type="email" defaultValue={profile.email} readOnly aria-readonly wide />
              <PhoneField name="phone" defaultValue={profile.phone ?? ""} />
            </FieldGroup>
          </Form>
        ) : (
          <>
            <dl className={styles.details}>
              <div>
                <dt>Ad</dt>
                <dd>{profile.first_name || "—"}</dd>
              </div>
              <div>
                <dt>Soyad</dt>
                <dd>{profile.last_name || "—"}</dd>
              </div>
              <div>
                <dt>E-posta</dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>Telefon</dt>
                <dd>{profile.phone || "—"}</dd>
              </div>
            </dl>
            <button type="button" className={styles.link} onClick={() => (setEditing(true), setMessage(null))}>
              Bilgileri düzenle
            </button>
          </>
        )}
      </section>
      <p className={styles.note}>Üyelik tarihi: {day(profile.created_at)}</p>
    </div>
  );
}

/* -------------------------------------------------------------- Adreslerim */

function AddressForm({ address, onDone, onCancel }: { address?: AddressRow; onDone: () => void; onCancel: () => void }) {
  const [failure, setFailure] = useState<string | null>(null);
  return (
    <div className={styles.formWrap}>
      <Form
        submitLabel={address ? "Adresi güncelle" : "Adresi kaydet"}
        note={failure ?? undefined}
        onValid={async (d) => {
          const get = (k: string) => String(d.get(k) ?? "").trim();
          const input: AddressInput = {
            title: get("title") || "Adres",
            first_name: get("first_name"),
            last_name: get("last_name"),
            phone: get("phone"),
            country: get("country") || "Türkiye",
            city: get("city"),
            district: get("district"),
            postal_code: get("postal_code"),
            address_line: get("address_line"),
            is_default: d.get("is_default") === "on",
          };
          setFailure(null);
          try {
            await saveAddress(input, address?.id);
            onDone();
          } catch {
            setFailure(SAVE_ERROR);
          }
        }}
      >
        <FieldGroup title={address ? "Adresi düzenle" : "Yeni adres"}>
          <TextField name="title" label="Adres başlığı" placeholder="Ev, ofis…" maxLength={60} defaultValue={address?.title} wide />
          <TextField name="first_name" label="Ad" required autoComplete="given-name" maxLength={80} defaultValue={address?.first_name} />
          <TextField name="last_name" label="Soyad" required autoComplete="family-name" maxLength={80} defaultValue={address?.last_name} />
          <PhoneField name="phone" required defaultValue={address?.phone} />
          <TextField name="country" label="Ülke" required autoComplete="country-name" maxLength={60} defaultValue={address?.country ?? "Türkiye"} />
          <TextField name="city" label="İl" required autoComplete="address-level1" maxLength={60} defaultValue={address?.city} />
          <TextField name="district" label="İlçe" required autoComplete="address-level2" maxLength={60} defaultValue={address?.district} />
          <TextField name="postal_code" label="Posta kodu" inputMode="numeric" autoComplete="postal-code" maxLength={12} defaultValue={address?.postal_code} />
          <TextField name="address_line" label="Adres" required autoComplete="street-address" minLength={5} maxLength={300} defaultValue={address?.address_line} wide />
          <CheckboxField name="is_default" label="Varsayılan adresim olsun" defaultChecked={address?.is_default} wide />
        </FieldGroup>
      </Form>
      <button type="button" className={styles.link} onClick={onCancel}>
        Vazgeç
      </button>
    </div>
  );
}

export function AddressesView() {
  const { data: addresses, error, loading, reload } = useRecord(fetchAddresses, "addresses");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  if (loading && !addresses) return <Loading what="Adresleriniz" />;
  if (error || !addresses) return <Failed retry={reload} />;

  const act = async (fn: () => Promise<void>) => {
    setFailure(null);
    try {
      await fn();
      reload();
    } catch {
      setFailure(SAVE_ERROR);
    }
  };
  const done = () => (setEditing(null), reload());

  return (
    <div className={styles.stack}>
      {failure && (
        <p className={styles.failed} role="alert">
          {failure}
        </p>
      )}
      {addresses.length > 0 ? (
        <ul className={styles.records}>
          {addresses.map((a) =>
            editing === a.id ? (
              <li key={a.id} className={styles.record}>
                <AddressForm address={a} onDone={done} onCancel={() => setEditing(null)} />
              </li>
            ) : (
              <li key={a.id} className={styles.record}>
                <div className={styles.recordHead}>
                  <p className={styles.recordTitle}>{a.title}</p>
                  {a.is_default && <p className={styles.status}>Varsayılan</p>}
                </div>
                <address className={styles.address}>
                  {a.first_name} {a.last_name} · {a.phone}
                  <br />
                  {a.address_line}
                  <br />
                  {a.district} / {a.city} {a.postal_code} · {a.country}
                </address>
                <div className={styles.actions}>
                  <button type="button" className={styles.link} onClick={() => setEditing(a.id)} aria-label={`${a.title} adresini düzenle`}>
                    Düzenle
                  </button>
                  {!a.is_default && (
                    <button type="button" className={styles.link} onClick={() => act(() => makeDefaultAddress(a.id))} aria-label={`${a.title} adresini varsayılan yap`}>
                      Varsayılan yap
                    </button>
                  )}
                  {confirming === a.id ? (
                    <span className={styles.confirm}>
                      Silinsin mi?
                      <button type="button" className={styles.link} onClick={() => act(() => deleteAddress(a.id)).then(() => setConfirming(null))}>
                        Evet, sil
                      </button>
                      <button type="button" className={styles.link} onClick={() => setConfirming(null)}>
                        Vazgeç
                      </button>
                    </span>
                  ) : (
                    <button type="button" className={styles.link} onClick={() => setConfirming(a.id)} aria-label={`${a.title} adresini sil`}>
                      Sil
                    </button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      ) : (
        editing !== "new" && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Kayıtlı bir adresiniz bulunmuyor.</p>
            <p className={styles.emptyText}>Teslimat adresinizi kaydedin; siparişlerinizde hazır olsun.</p>
          </div>
        )
      )}
      {editing === "new" ? (
        <AddressForm onDone={done} onCancel={() => setEditing(null)} />
      ) : (
        <div>
          <Button onClick={() => setEditing("new")} className={styles.add}>
            Yeni adres ekleyin
          </Button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Siparişlerim */

export function OrdersView() {
  const { data: orders, error, loading, reload } = useRecord(fetchOrders, "orders");
  if (loading && !orders) return <Loading what="Siparişleriniz" />;
  if (error || !orders) return <Failed retry={reload} />;
  if (!orders.length)
    return (
      <Empty
        title="Henüz bir siparişiniz bulunmuyor."
        text="Siparişleriniz, durumları ve ayrıntılarıyla burada yer alır."
        href="/#koleksiyon"
        cta="Koleksiyonu keşfedin"
      />
    );
  return (
    <ul className={styles.records}>
      {orders.map((o) => (
        <li key={o.id} className={styles.record}>
          <div className={styles.recordHead}>
            <p className={styles.recordTitle}>{o.order_number}</p>
            <p className={styles.status}>{ORDER_STATUS[o.status] ?? o.status}</p>
          </div>
          <p className={styles.muted}>{day(o.created_at)}</p>
          <ul className={styles.items}>
            {(o.order_items ?? []).map((i) => (
              <li key={i.id} className={styles.item}>
                <span className={styles.itemThumb}>
                  {i.product_image && <Image src={i.product_image} alt="" fill sizes="56px" />}
                </span>
                <span>
                  {i.product_name}
                  {i.quantity > 1 && <span className={styles.muted}> × {i.quantity}</span>}
                </span>
                <span className={styles.itemPrice}>{formatPrice(Number(i.total_price), o.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className={styles.totals}>
            <div>
              <dt>Ara toplam</dt>
              <dd>{formatPrice(Number(o.subtotal), o.currency)}</dd>
            </div>
            <div>
              <dt>Kargo</dt>
              <dd>{Number(o.shipping_cost) ? formatPrice(Number(o.shipping_cost), o.currency) : "Ücretsiz"}</dd>
            </div>
            <div>
              <dt>Toplam</dt>
              <dd>{formatPrice(Number(o.total), o.currency)}</dd>
            </div>
          </dl>
          {o.shipping_address?.address_line && (
            <p className={styles.muted}>
              Teslimat: {o.shipping_address.address_line}, {o.shipping_address.district} / {o.shipping_address.city}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------- Randevu ve talepler */

export function RequestsView() {
  const { requests } = useAccount();
  if (!requests.length)
    return (
      <Empty
        title="Henüz bir talebiniz yok."
        text="Bilgi ve randevu talepleriniz burada listelenir."
        href="/iletisim"
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
