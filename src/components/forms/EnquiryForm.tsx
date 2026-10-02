"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { submitEnquiry, type EnquiryRequest, type EnquiryResult } from "@/lib/services/enquiries";
import { FormButton } from "./FormButton";
import { FormMessage } from "./FormMessage";
import styles from "./forms.module.css";

type FormCtx = { errors: Record<string, string>; clear: (name: string) => void };
const Ctx = createContext<FormCtx>({ errors: {}, clear: () => {} });
export const useFieldError = (name: string) => {
  const { errors, clear } = useContext(Ctx);
  return { error: errors[name], clear: () => clear(name) };
};

/** House wording for the browser's validity states. */
function messageFor(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  const v = el.validity;
  if (v.valueMissing) return el instanceof HTMLSelectElement || el.type === "radio" ? "Bir seçim yapın." : "Bu alanı doldurun.";
  if (v.typeMismatch && el.type === "email") return "Geçerli bir e-posta adresi yazın.";
  if (v.patternMismatch && el.type === "tel") return "Geçerli bir telefon numarası yazın.";
  if (v.rangeUnderflow) return "Bugünden sonraki bir gün seçin.";
  return "Bu alanı kontrol edin.";
}

/**
 * Every enquiry form on the site: validates in place with quiet inline
 * messages, turns the answers into an EnquiryRequest (`build`) and hands it to
 * the enquiry service. The result replaces the form.
 */
export function EnquiryForm({
  build,
  submitLabel,
  children,
}: {
  build: (data: FormData) => EnquiryRequest;
  submitLabel: string;
  children: ReactNode;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const form = useRef<HTMLFormElement>(null);

  const clear = (name: string) => setErrors((e) => (e[name] ? { ...e, [name]: "" } : e));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    const found: Record<string, string> = {};
    let first: HTMLElement | null = null;
    for (const c of Array.from(el.elements)) {
      if (!(c instanceof HTMLInputElement || c instanceof HTMLSelectElement || c instanceof HTMLTextAreaElement)) continue;
      if (!c.name || !c.willValidate || c.checkValidity() || found[c.name]) continue;
      found[c.name] = messageFor(c);
      first ??= c;
    }
    setErrors(found);
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setPending(true);
    try {
      setResult(await submitEnquiry(build(new FormData(el))));
      form.current?.closest("section")?.scrollIntoView({ block: "start", behavior: "smooth" });
    } finally {
      setPending(false);
    }
  };

  // The form stays mounted (hidden) under the result, so "edit" keeps the answers.
  return (
    <Ctx.Provider value={{ errors, clear }}>
      {result && <FormMessage result={result} onReset={() => setResult(null)} />}
      <form ref={form} className={styles.form} onSubmit={onSubmit} noValidate hidden={!!result}>
        {children}
        <div className={styles.submit}>
          <FormButton pending={pending}>{submitLabel}</FormButton>
          <p className={styles.privacy}>Bilgileriniz yalnızca talebinizi yanıtlamak için kullanılır.</p>
        </div>
      </form>
    </Ctx.Provider>
  );
}
