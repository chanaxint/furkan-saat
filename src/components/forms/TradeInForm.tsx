"use client";

import { EnquiryForm } from "./EnquiryForm";
import { FileUpload } from "./FileUpload";
import { FieldGroup, SelectField, TextArea } from "./fields";
import { contactAnswers, ContactFields, watchAnswers, WatchFields } from "./fieldsets";
import { WATCH_OPTIONS, watchOptionLabel } from "./options";

/** /takas — the customer's watch in part exchange for one from the boutique. */
export function TradeInForm() {
  return (
    <EnquiryForm
      submitLabel="Takas talebi gönderin"
      build={(d) => ({
        kind: "takas",
        title: "Takas talebi",
        fields: [
          ...watchAnswers(d).map(([k, v]) => [`Saatim — ${k.toLocaleLowerCase("tr")}`, v] as [string, string]),
          ["İstediğim saat", d.get("wanted") ? watchOptionLabel(String(d.get("wanted"))) : ""],
          ["Not", String(d.get("note") ?? "")],
          ...contactAnswers(d),
        ],
        photos: Number(d.get("photosCount") ?? 0),
      })}
    >
      <WatchFields title="Takasa vereceğiniz saat" />
      <FieldGroup title="Almak istediğiniz saat">
        <SelectField name="wanted" label="Koleksiyondan bir saat" options={WATCH_OPTIONS} placeholder="Koleksiyon dışında bir saat" wide />
        <TextArea name="note" label="Aradığınız saat ya da notlarınız" placeholder="Koleksiyonda olmayan bir referans arıyorsanız buraya yazın." />
        <FileUpload name="photos" label="Saatinizin fotoğrafları" />
      </FieldGroup>
      <ContactFields />
    </EnquiryForm>
  );
}
