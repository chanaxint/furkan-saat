"use client";

import { useState } from "react";
import styles from "./admin.module.css";

/** A small confirmation in the corner after each save. */
export function useStatus() {
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const show = (text: string, error = false) => {
    setStatus({ text, error });
    window.setTimeout(() => setStatus(null), error ? 6000 : 2500);
  };
  const node = status && (
    <p className={styles.status} data-error={status.error || undefined} role="status">
      {status.text}
    </p>
  );
  return { show, node };
}
