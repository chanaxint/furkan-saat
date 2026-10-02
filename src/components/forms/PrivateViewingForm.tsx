"use client";

import { useEffect, useState } from "react";
import { EnquiryForm } from "./EnquiryForm";
import { FieldGroup, SelectField, TextArea, TextField } from "./fields";
import { contactAnswers, ContactFields } from "./fieldsets";
import { BRAND_OPTIONS, TIME_OPTIONS, WATCH_OPTIONS, watchLabel } from "./options";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** /ozel-gosterim — a watch page links here as ?saat=[slug] to preselect the watch. */
export function PrivateViewingForm() {
  const [watch, setWatch] = useState("");
  const [minDate, setMinDate] = useState<string>();

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("saat");
    if (slug && WATCH_OPTIONS.some((o) => o.value === slug)) setWatch(slug);
    setMinDate(today());
  }, []);

  return (
    <EnquiryForm
      submitLabel="Randevu talep edin"
      build={(d) => ({
        kind: "ozel-gosterim",
        title: "Özel gösterim talebi",
        fields: [
          ["Tarih", String(d.get("date") ?? "")],
          ["Saat", String(d.get("time") ?? "")],
          ["İlgilendiğim marka", String(d.get("brand") ?? "")],
          ["İlgilendiğim saat", d.get("watch") ? watchLabel(String(d.get("watch"))) : ""],
          ["Not", String(d.get("note") ?? "")],
          ...contactAnswers(d),
        ],
      })}
    >
      <FieldGroup title="Randevunuz">
        <TextField name="date" label="Tercih ettiğiniz gün" type="date" required min={minDate} />
        <SelectField name="time" label="Saat" options={TIME_OPTIONS} required />
        <SelectField name="brand" label="İlgilendiğiniz marka" options={BRAND_OPTIONS} />
        <SelectField
          name="watch"
          label="İlgilendiğiniz saat"
          options={WATCH_OPTIONS}
          placeholder="Henüz karar vermedim"
          value={watch}
          onChange={(e) => setWatch(e.target.value)}
        />
        <TextArea name="note" label="Eklemek istedikleriniz" placeholder="Görmek istediğiniz başka referanslar, kaç kişi geleceğiniz…" />
      </FieldGroup>
      <ContactFields />
    </EnquiryForm>
  );
}
