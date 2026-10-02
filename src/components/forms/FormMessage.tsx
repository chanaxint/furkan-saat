"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import type { EnquiryResult } from "@/lib/services/enquiries";
import styles from "./forms.module.css";

/** Shown in place of the form once a request has been prepared or received. */
export function FormMessage({ result, onReset }: { result: EnquiryResult; onReset: () => void }) {
  if (result.status === "received")
    return (
      <div className={styles.message} role="status">
        <p className={styles.messageTitle}>Talebiniz alındı.</p>
        <p className={styles.messageText}>Bir danışmanımız en kısa sürede sizinle iletişime geçecek.</p>
      </div>
    );

  return (
    <div className={styles.message} role="status">
      <p className={styles.messageTitle}>
        Talebiniz <em>hazır.</em>
      </p>
      <p className={styles.messageText}>
        Göndermek için WhatsApp&apos;ı ya da e-postanızı açın; mesaj hazırlanmış olarak gelecek. Fotoğraf seçtiyseniz
        onları da aynı sohbete ekleyin.
      </p>
      <div className={styles.messageActions}>
        <ButtonLink href={result.whatsapp} external variant="solid">
          WhatsApp ile gönder
        </ButtonLink>
        <ButtonLink href={result.email}>E-posta ile gönder</ButtonLink>
      </div>
      <Button variant="line" onClick={onReset} className={styles.messageBack}>
        Formu düzenle
      </Button>
    </div>
  );
}
