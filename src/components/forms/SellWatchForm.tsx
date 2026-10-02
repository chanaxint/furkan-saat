"use client";

import { EnquiryForm } from "./EnquiryForm";
import { FileUpload } from "./FileUpload";
import { FieldGroup, TextArea, TextField } from "./fields";
import { contactAnswers, ContactFields, watchAnswers, WatchFields } from "./fieldsets";

/** /saatinizi-satin — a valuation request for the customer's watch. */
export function SellWatchForm() {
  return (
    <EnquiryForm
      submitLabel="Değerleme talep edin"
      build={(d) => ({
        kind: "degerleme",
        title: "Değerleme talebi",
        fields: [
          ...watchAnswers(d),
          ["Beklenen fiyat", String(d.get("expected") ?? "")],
          ["Not", String(d.get("note") ?? "")],
          ...contactAnswers(d),
        ],
        photos: Number(d.get("photosCount") ?? 0),
      })}
    >
      <WatchFields />
      <FieldGroup title="Fotoğraflar ve beklentiniz">
        <FileUpload name="photos" label="Fotoğraflar" />
        <TextField name="expected" label="Beklediğiniz fiyat" placeholder="Örn. 15.000 €" wide />
        <TextArea name="note" label="Saat hakkında eklemek istedikleriniz" placeholder="Bakım geçmişi, aksesuarlar, varsa çizik ya da onarımlar…" />
      </FieldGroup>
      <ContactFields />
    </EnquiryForm>
  );
}
