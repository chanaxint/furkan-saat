"use client";

import { useRouter } from "next/navigation";
import { FieldGroup, TextField } from "@/components/forms/fields";
import { Form } from "@/components/forms/Form";
import type { Settings } from "@/lib/data/site";
import { putJson } from "./api";
import { useStatus } from "./useStatus";

/** Contact details used across the site (WhatsApp buttons, footer, contact page) and the bank account. */
export function SettingsEditor({ settings }: { settings: Settings }) {
  const router = useRouter();
  const status = useStatus();
  const b = settings.boutique;
  const k = settings.bank;
  return (
    <>
      <Form
        submitLabel="Kaydedin"
        onValid={async (d) => {
          const get = (key: string) => String(d.get(key) ?? "").trim();
          try {
            await putJson("/api/yonetim/ayarlar", {
              boutique: {
                name: get("name"),
                city: get("city"),
                address: get("address"),
                hours: get("hours"),
                email: get("email"),
                phone: get("phone"),
                whatsapp: get("whatsapp"),
                instagram: get("instagram"),
                mapUrl: get("mapUrl"),
              },
              bank: { holder: get("holder"), bank: get("bank"), iban: get("iban") },
            });
            status.show("Kaydedildi.");
            router.refresh();
          } catch (e) {
            status.show((e as Error).message, true);
          }
        }}
      >
        <FieldGroup title="Butik">
          <TextField name="name" label="Butik adı" required defaultValue={b.name} />
          <TextField name="city" label="Şehir" required defaultValue={b.city} />
          <TextField name="address" label="Adres" required defaultValue={b.address} wide />
          <TextField name="hours" label="Çalışma saatleri" required defaultValue={b.hours} wide />
          <TextField name="mapUrl" label="Google Haritalar bağlantısı" required defaultValue={b.mapUrl} wide />
        </FieldGroup>
        <FieldGroup title="İletişim">
          <TextField name="phone" label="Telefon" required defaultValue={b.phone} />
          <TextField
            name="whatsapp"
            label="WhatsApp numarası"
            required
            defaultValue={b.whatsapp}
            hint="Ülke koduyla, yalnızca rakam: 905321234567. Sitedeki tüm WhatsApp butonları bu numaraya gider."
          />
          <TextField name="email" label="E-posta" type="email" required defaultValue={b.email} />
          <TextField name="instagram" label="Instagram bağlantısı" required defaultValue={b.instagram} />
        </FieldGroup>
        <FieldGroup title="Banka hesabı (havale ile ödeme)">
          <TextField name="holder" label="Hesap sahibi" required defaultValue={k.holder} />
          <TextField name="bank" label="Banka" required defaultValue={k.bank} />
          <TextField name="iban" label="IBAN" required defaultValue={k.iban} wide />
        </FieldGroup>
      </Form>
      {status.node}
    </>
  );
}
