"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { FormButton } from "./FormButton";
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
 * The site's form frame: validates in place with quiet inline messages and
 * only calls `onValid` with the answers once every field is in order.
 */
export function Form({
  onValid,
  submitLabel,
  note,
  hidden,
  className = "",
  children,
}: {
  onValid: (data: FormData) => Promise<void> | void;
  submitLabel: string;
  note?: ReactNode;
  hidden?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
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
      await onValid(new FormData(el));
    } finally {
      setPending(false);
    }
  };

  return (
    <Ctx.Provider value={{ errors, clear }}>
      <form className={`${styles.form} ${className}`} onSubmit={onSubmit} noValidate hidden={hidden}>
        {children}
        <div className={styles.submit}>
          <FormButton pending={pending}>{submitLabel}</FormButton>
          {note && <p className={styles.privacy}>{note}</p>}
        </div>
      </form>
    </Ctx.Provider>
  );
}
