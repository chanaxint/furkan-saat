"use client";

import { ChoiceField, FieldGroup, PhoneField, SelectField, TextField } from "./fields";
import { BRAND_OPTIONS, CONDITION_OPTIONS, YES_NO } from "./options";

/** Who is asking — the same three fields on every form. */
export function ContactFields() {
  return (
    <FieldGroup title="İletişim bilgileriniz">
      <TextField name="name" label="Ad soyad" required autoComplete="name" wide />
      <TextField name="email" label="E-posta" type="email" required autoComplete="email" />
      <PhoneField name="phone" required />
    </FieldGroup>
  );
}

/** The customer's own watch (selling and trade-in). */
export function WatchFields({ title = "Saatiniz" }: { title?: string }) {
  return (
    <FieldGroup title={title}>
      <SelectField name="brand" label="Marka" options={BRAND_OPTIONS} required />
      <TextField name="model" label="Model" required placeholder="Örn. Submariner Date" />
      <TextField name="reference" label="Referans" placeholder="Örn. 126610LN" hint="Kasa arkasında ya da garanti belgesinde yazar." />
      <TextField name="year" label="Yıl" inputMode="numeric" placeholder="Örn. 2021" />
      <SelectField name="condition" label="Durum" options={CONDITION_OPTIONS} required wide />
      <ChoiceField name="box" label="Kutu" options={YES_NO} required />
      <ChoiceField name="papers" label="Belgeler" options={YES_NO} required />
    </FieldGroup>
  );
}

/** Reads the shared groups back out of the submitted form, in reading order. */
export const contactAnswers = (d: FormData): [string, string][] => [
  ["Ad soyad", String(d.get("name") ?? "")],
  ["E-posta", String(d.get("email") ?? "")],
  ["Telefon", String(d.get("phone") ?? "")],
];

export const watchAnswers = (d: FormData): [string, string][] => [
  ["Marka", String(d.get("brand") ?? "")],
  ["Model", String(d.get("model") ?? "")],
  ["Referans", String(d.get("reference") ?? "")],
  ["Yıl", String(d.get("year") ?? "")],
  ["Durum", String(d.get("condition") ?? "")],
  ["Kutu", String(d.get("box") ?? "")],
  ["Belgeler", String(d.get("papers") ?? "")],
];
