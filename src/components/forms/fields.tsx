"use client";

import { useId, type ReactNode } from "react";
import { useFieldError } from "./Form";
import styles from "./forms.module.css";

type Base = {
  name: string;
  label: string;
  required?: boolean;
  /** Spans both columns of the form grid. */
  wide?: boolean;
  hint?: string;
};

/** Label, control and message — the frame every field shares. */
function Field({ id, label, required, wide, hint, error, children }: Omit<Base, "name"> & { id: string; error?: string; children: ReactNode }) {
  return (
    <div className={styles.field} data-wide={wide || undefined} data-invalid={error ? true : undefined}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {!required && <span className={styles.optional}> · isteğe bağlı</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className={styles.error}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  required,
  wide,
  hint,
  type = "text",
  ...rest
}: Base & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = useId();
  const { error, clear } = useFieldError(name);
  return (
    <Field id={id} label={label} required={required} wide={wide} hint={hint} error={error}>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        className={styles.input}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        onInput={clear}
        {...rest}
      />
    </Field>
  );
}

/** Phone number: digits, spaces, +, brackets and dashes; at least ten characters. */
export function PhoneField(props: Omit<Base, "label"> & { label?: string; defaultValue?: string }) {
  return (
    <TextField
      label="Telefon"
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      pattern="[0-9+ \(\)\-]{10,}"
      placeholder="+90 5__ ___ __ __"
    />
  );
}

export function TextArea({ name, label, required, wide = true, hint, ...rest }: Base & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = useId();
  const { error, clear } = useFieldError(name);
  return (
    <Field id={id} label={label} required={required} wide={wide} hint={hint} error={error}>
      <textarea id={id} name={name} required={required} rows={4} className={styles.input} aria-invalid={!!error} onInput={clear} {...rest} />
    </Field>
  );
}

export type Option = { value: string; label: string };

export function SelectField({
  name,
  label,
  required,
  wide,
  hint,
  options,
  placeholder = "Seçin",
  ...rest
}: Base & { options: Option[]; placeholder?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const id = useId();
  const { error, clear } = useFieldError(name);
  return (
    <Field id={id} label={label} required={required} wide={wide} hint={hint} error={error}>
      <select
        id={id}
        name={name}
        required={required}
        className={`${styles.input} ${styles.select}`}
        aria-invalid={!!error}
        onInput={clear}
        defaultValue={rest.value === undefined ? "" : undefined}
        {...rest}
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** A short set of answers shown side by side (Evet / Hayır). */
export function ChoiceField({
  name,
  label,
  required,
  wide,
  options,
  value,
  onChange,
}: Base & { options: Option[]; value?: string; onChange?: (value: string) => void }) {
  const id = useId();
  const { error, clear } = useFieldError(name);
  return (
    <fieldset className={`${styles.field} ${styles.choice}`} data-wide={wide || undefined} data-invalid={error ? true : undefined}>
      <legend className={styles.label}>
        {label}
        {!required && <span className={styles.optional}> · isteğe bağlı</span>}
      </legend>
      <div className={styles.choices}>
        {options.map((o) => (
          <label key={o.value} className={styles.choiceOption}>
            <input
              type="radio"
              name={name}
              value={o.value}
              required={required}
              {...(value !== undefined ? { checked: value === o.value } : {})}
              onChange={() => {
                clear();
                onChange?.(o.value);
              }}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-msg`} className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** A titled group of fields inside a form. */
export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupTitle}>{title}</legend>
      <div className={styles.grid}>{children}</div>
    </fieldset>
  );
}

/** A single yes/no box (e.g. "featured"). */
export function CheckboxField({ name, label, defaultChecked, wide }: { name: string; label: string; defaultChecked?: boolean; wide?: boolean }) {
  return (
    <label className={styles.check} data-wide={wide || undefined}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

/** Several boxes under one label; the form receives every checked value under `name`. */
export function CheckboxGroup({ name, label, options, defaultValue = [] }: { name: string; label: string; options: Option[]; defaultValue?: string[] }) {
  return (
    <fieldset className={`${styles.field} ${styles.choice}`} data-wide>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.checks}>
        {options.map((o) => (
          <label key={o.value} className={styles.check}>
            <input type="checkbox" name={name} value={o.value} defaultChecked={defaultValue.includes(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
