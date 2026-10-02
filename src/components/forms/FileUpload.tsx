"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./forms.module.css";

const MAX_FILES = 8;

/**
 * Photograph picker with previews. Files stay in the browser for now (the
 * customer adds them to the WhatsApp or e-mail message); the count travels
 * with the form as `${name}Count`.
 */
export function FileUpload({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);

  // Release preview URLs when the picker goes away.
  const shown = useRef(files);
  shown.current = files;
  useEffect(() => () => shown.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const remove = (url: string) => {
    URL.revokeObjectURL(url);
    setFiles((cur) => cur.filter((x) => x.url !== url));
  };

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setFiles((cur) => [...cur, ...next].slice(0, MAX_FILES));
    if (input.current) input.current.value = "";
  };

  return (
    <div className={styles.field} data-wide>
      <p className={styles.label}>
        {label}
        <span className={styles.optional}> · isteğe bağlı</span>
      </p>
      <label
        htmlFor={id}
        className={styles.drop}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
      >
        <span className={styles.dropTitle}>Fotoğraf ekleyin</span>
        <span className={styles.hint}>{hint ?? `Kadran, kasa arkası, kutu ve belgeler — en fazla ${MAX_FILES} fotoğraf.`}</span>
      </label>
      <input ref={input} id={id} type="file" accept="image/*" multiple className="visually-hidden" onChange={(e) => add(e.target.files)} />
      <input type="hidden" name={`${name}Count`} value={files.length} />
      {files.length > 0 && (
        <ul className={styles.previews}>
          {files.map((f, i) => (
            <li key={f.url}>
              <img src={f.url} alt={`Seçilen fotoğraf ${i + 1}`} />
              <button type="button" onClick={() => remove(f.url)} aria-label={`Fotoğraf ${i + 1}'i kaldır`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
