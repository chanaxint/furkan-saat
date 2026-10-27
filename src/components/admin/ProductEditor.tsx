"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckboxField, CheckboxGroup, FieldGroup, SelectField, TextArea, TextField, type Option } from "@/components/forms/fields";
import { Form } from "@/components/forms/Form";
import { AVAILABILITY, CONDITIONS, CURRENCIES, MOVEMENTS, type Product } from "@/lib/data/types";
import { slugify } from "@/lib/format";
import { adminFetch, discardImage, putJson } from "./api";
import { ImageManager } from "./ImageManager";
import { useStatus } from "./useStatus";
import styles from "./admin.module.css";

const opts = (list: readonly string[]): Option[] => list.map((v) => ({ value: v, label: v }));
const today = () => new Date().toISOString().slice(0, 10);

/** Adds or edits a watch. New watches get their address from brand, model and reference. */
export function ProductEditor({
  product,
  brands,
  collections,
}: {
  product: Product | null;
  brands: Option[];
  collections: Option[];
}) {
  const router = useRouter();
  const status = useStatus();
  const [images, setImages] = useState(product?.images ?? []);
  // Photographs uploaded to Storage since the last save (address → object name):
  // removed before saving, they are deleted; once saved, they belong to the watch.
  const [unsaved, setUnsaved] = useState<Record<string, string>>({});
  const hasUnsaved = Object.keys(unsaved).length > 0;
  // While a save is under way the form is locked: a photograph removed now could
  // be deleted from Storage just before the save that still uses it lands.
  const [saving, setSaving] = useState(false);

  // Leaving with unsaved uploads would leave them unused in Storage: ask first.
  useEffect(() => {
    if (!hasUnsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved]);

  const keepUploaded = (uploads: { path: string; object?: string }[]) =>
    setUnsaved((u) => ({ ...u, ...Object.fromEntries(uploads.filter((x) => x.object).map((x) => [x.path, x.object as string])) }));

  const discardRemoved = async (src: string) => {
    const object = unsaved[src];
    if (!object) return; // a photograph the watch already had: kept in Storage
    setUnsaved(({ [src]: _gone, ...rest }) => rest);
    try {
      await discardImage(object);
    } catch (e) {
      status.show((e as Error).message, true);
    }
  };
  // Names uploaded photo files after the watch.
  const [name, setName] = useState(product?.slug ?? "");

  const onValid = async (d: FormData) => {
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const slug =
      product?.slug ??
      slugify([get("brand"), get("model"), get("reference")].join(" "));
    const next = {
      slug,
      brand: get("brand"),
      model: get("model"),
      reference: get("reference"),
      price: get("price") ? Number(get("price").replace(/\./g, "").replace(",", ".")) : null,
      currency: get("currency"),
      images,
      // The head-on picture is not edited here: keep it as it is.
      ...(product?.front ? { front: product.front } : {}),
      description: get("description"),
      specs: {
        movement: get("movement"),
        caliber: get("caliber"),
        powerReserve: get("powerReserve"),
        caseDiameter: get("caseDiameter"),
        caseMaterial: get("caseMaterial"),
        crystal: get("crystal"),
        waterResistance: get("waterResistance"),
        strap: get("strap"),
        year: get("year"),
      },
      condition: get("condition"),
      availability: get("availability"),
      fullSet: d.get("fullSet") === "on",
      collections: d.getAll("collections").map(String),
      featured: d.get("featured") === "on",
      addedAt: get("addedAt"),
      tone: product?.tone ?? "deep",
    };
    setSaving(true);
    try {
      await putJson("/api/yonetim/urunler", { product: next, previous: product?.slug });
      // Only the photographs this save stored now belong to the watch; any uploaded meanwhile stay pending.
      setUnsaved((u) => Object.fromEntries(Object.entries(u).filter(([src]) => !images.includes(src))));
      status.show("Kaydedildi.");
      if (!product) router.push(`/yonetim/urunler/${slug}`);
      router.refresh();
    } catch (e) {
      status.show((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!product || !window.confirm(`${product.model} silinsin mi?`)) return;
    try {
      await adminFetch(`/api/yonetim/urunler?slug=${product.slug}`, { method: "DELETE" });
      router.push("/yonetim");
      router.refresh();
    } catch (e) {
      status.show((e as Error).message, true);
    }
  };

  const p = product;
  return (
    <>
      <Form onValid={onValid} submitLabel={p ? "Değişiklikleri kaydedin" : "Saati ekleyin"} note={p ? <>Sayfası: <Link href={`/saat/${p.slug}`} target="_blank" className={styles.link}>/saat/{p.slug}</Link></> : undefined}>
        <fieldset disabled={saving} className={styles.lock}>
          <FieldGroup title="Saat">
            <SelectField name="brand" label="Marka" options={brands} required defaultValue={p?.brand} />
            <TextField name="model" label="Model" required defaultValue={p?.model} onChange={(e) => setName(e.target.value)} />
            <TextField name="reference" label="Referans" defaultValue={p?.reference} hint="Üreticinin model numarası; yoksa boş bırakın." />
            <TextField name="addedAt" label="Eklenme tarihi" type="date" required defaultValue={p?.addedAt ?? today()} />
            <TextArea name="description" label="Kısa açıklama" required defaultValue={p?.description} />
          </FieldGroup>

          <FieldGroup title="Fiyat ve stok">
            <TextField name="price" label="Fiyat" inputMode="decimal" defaultValue={p?.price ?? ""} hint="Boş bırakırsanız “Fiyat için bilgi alın” yazar ve saat yalnızca bilgi alınarak satılır." />
            <SelectField name="currency" label="Para birimi" options={opts(CURRENCIES)} required defaultValue={p?.currency ?? "EUR"} />
            <SelectField name="availability" label="Bulunabilirlik" options={opts(AVAILABILITY)} required defaultValue={p?.availability ?? "Stokta"} />
            <SelectField name="condition" label="Durum" options={opts(CONDITIONS)} required defaultValue={p?.condition} />
            <CheckboxField name="fullSet" label="Kutu ve belgeleri var" defaultChecked={p?.fullSet ?? true} />
            <CheckboxField name="featured" label="Ana sayfadaki seçkide göster" defaultChecked={p?.featured} />
            <CheckboxGroup name="collections" label="Koleksiyonlar" options={collections} defaultValue={p?.collections} />
          </FieldGroup>

          <FieldGroup title="Teknik özellikler">
            <SelectField name="movement" label="Mekanizma" options={opts(MOVEMENTS)} required defaultValue={p?.specs.movement} />
            <TextField name="caliber" label="Kalibre" defaultValue={p?.specs.caliber} />
            <TextField name="powerReserve" label="Güç rezervi" defaultValue={p?.specs.powerReserve} placeholder="Yaklaşık 70 saat" />
            <TextField name="caseDiameter" label="Kasa çapı" defaultValue={p?.specs.caseDiameter} placeholder="41 mm" />
            <TextField name="caseMaterial" label="Kasa malzemesi" required defaultValue={p?.specs.caseMaterial} />
            <TextField name="crystal" label="Cam" defaultValue={p?.specs.crystal} placeholder="Safir" />
            <TextField name="waterResistance" label="Su geçirmezlik" defaultValue={p?.specs.waterResistance} placeholder="300 m" />
            <TextField name="strap" label="Kordon / bilezik" defaultValue={p?.specs.strap} />
            <TextField name="year" label="Yıl" defaultValue={p?.specs.year} />
          </FieldGroup>

          <FieldGroup title="Fotoğraflar">
            <ImageManager
              images={images}
              onChange={setImages}
              name={name || "saat"}
              onError={(m) => status.show(m, true)}
              onUploaded={keepUploaded}
              onRemove={discardRemoved}
              disabled={saving}
            />
          </FieldGroup>
        </fieldset>
      </Form>
      {p && (
        <p style={{ marginTop: 48 }}>
          <button type="button" className={styles.danger} onClick={remove} disabled={saving}>
            Bu saati silin
          </button>
        </p>
      )}
      {status.node}
    </>
  );
}
