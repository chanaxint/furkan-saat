"use client";

import { useRef, useState } from "react";
import { uploadImage } from "./api";
import styles from "./admin.module.css";

/** Order, remove and upload a watch's photographs. The first one is the cover. */
export function ImageManager({
  images,
  onChange,
  name,
  onError,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  /** Used to name uploaded files. */
  name: string;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const move = (i: number, d: number) => {
    const next = [...images];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const f of Array.from(files)) added.push(await uploadImage(f, name));
      onChange([...images, ...added]);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={styles.images}>
      {images.length > 0 && (
        <ul className={styles.imageGrid}>
          {images.map((src, i) => (
            <li key={src} className={styles.imageItem}>
              <img src={src} alt={`Fotoğraf ${i + 1}`} />
              {i === 0 && <span className={styles.cover}>Kapak</span>}
              <div className={styles.imageActions}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Öne al">
                  ←
                </button>
                <button type="button" onClick={() => onChange(images.filter((x) => x !== src))}>
                  Kaldır
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Geri al">
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <input ref={input} type="file" accept="image/webp,image/jpeg,image/png,image/avif" multiple onChange={(e) => upload(e.target.files)} className="visually-hidden" id="admin-upload" />
        <label htmlFor="admin-upload" className={styles.link} style={{ cursor: "pointer" }}>
          {uploading ? "Yükleniyor…" : "Fotoğraf yükleyin"}
        </label>
      </div>
      <p className={styles.help}>
        İlk fotoğraf kapaktır, ikincisi koleksiyonda üzerine gelince görünür. En iyi sonuç için 4:5 oranında, en az 1200 piksel genişliğinde fotoğraf kullanın.
      </p>
    </div>
  );
}
