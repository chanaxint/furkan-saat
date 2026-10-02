"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckboxGroup, FieldGroup, TextArea, TextField, type Option } from "@/components/forms/fields";
import { Form } from "@/components/forms/Form";
import { blocksToText, textToBlocks } from "@/lib/admin/markup";
import type { Article } from "@/lib/data/types";
import { slugify } from "@/lib/format";
import { adminFetch, putJson } from "./api";
import { ImageManager } from "./ImageManager";
import { useStatus } from "./useStatus";
import styles from "./admin.module.css";

const today = () => new Date().toISOString().slice(0, 10);

/** Adds or edits a journal article. */
export function ArticleEditor({ article, brands, products }: { article: Article | null; brands: Option[]; products: Option[] }) {
  const router = useRouter();
  const status = useStatus();
  const [cover, setCover] = useState<string[]>(article ? [article.cover] : []);
  const a = article;

  const onValid = async (d: FormData) => {
    const get = (k: string) => String(d.get(k) ?? "").trim();
    if (!cover[0]) return status.show("Bir kapak fotoğrafı yükleyin.", true);
    const slug = a?.slug ?? slugify(get("title"));
    const next = {
      slug,
      title: get("title"),
      category: get("category"),
      excerpt: get("excerpt"),
      date: get("date"),
      readTime: get("readTime"),
      cover: cover[0],
      body: textToBlocks(get("body")),
      brands: d.getAll("brands").map(String),
      products: d.getAll("products").map(String),
    };
    try {
      await putJson("/api/yonetim/dergi", { article: next, previous: a?.slug });
      status.show("Kaydedildi.");
      if (!a) router.push(`/yonetim/dergi/${slug}`);
      router.refresh();
    } catch (e) {
      status.show((e as Error).message, true);
    }
  };

  const remove = async () => {
    if (!a || !window.confirm(`“${a.title}” silinsin mi?`)) return;
    try {
      await adminFetch(`/api/yonetim/dergi?slug=${a.slug}`, { method: "DELETE" });
      router.push("/yonetim/dergi");
      router.refresh();
    } catch (e) {
      status.show((e as Error).message, true);
    }
  };

  return (
    <>
      <Form onValid={onValid} submitLabel={a ? "Değişiklikleri kaydedin" : "Yazıyı yayınlayın"}>
        <FieldGroup title="Yazı">
          <TextField name="title" label="Başlık" required defaultValue={a?.title} wide />
          <TextField name="category" label="Kategori" required defaultValue={a?.category} placeholder="Zanaat, İkonlar, Rehber…" />
          <TextField name="readTime" label="Okuma süresi" required defaultValue={a?.readTime ?? "5 dk okuma"} />
          <TextField name="date" label="Tarih" type="date" required defaultValue={a?.date ?? today()} />
          <TextArea name="excerpt" label="Özet" required defaultValue={a?.excerpt} rows={2} />
          <TextArea name="body" label="Metin" required defaultValue={a ? blocksToText(a.body) : ""} rows={18} />
          <p className={styles.help}>
            Paragrafları boş bir satırla ayırın. Ara başlık için satırı <code>## </code> ile, öne çıkan alıntı için <code>&gt; </code> ile başlatın.
          </p>
        </FieldGroup>
        <FieldGroup title="Kapak">
          <ImageManager images={cover} onChange={(list) => setCover(list.slice(-1))} name={a?.slug ?? "dergi"} onError={(m) => status.show(m, true)} />
        </FieldGroup>
        <FieldGroup title="Bağlantılar">
          <CheckboxGroup name="brands" label="İlgili markalar (marka sayfalarında görünür)" options={brands} defaultValue={a?.brands} />
          <CheckboxGroup name="products" label="Yazının altında gösterilecek saatler" options={products} defaultValue={a?.products} />
        </FieldGroup>
      </Form>
      {a && (
        <p style={{ marginTop: 48 }}>
          <button type="button" className={styles.danger} onClick={remove}>
            Bu yazıyı silin
          </button>
        </p>
      )}
      {status.node}
    </>
  );
}
