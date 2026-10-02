"use client";

import { useWishlist } from "@/lib/services/wishlist";
import { HeartIcon } from "./icons";
import styles from "./WishlistButton.module.css";

/** Heart toggle. `labelled` adds the word next to the icon (watch page). */
export function WishlistButton({ slug, labelled = false, className = "" }: { slug: string; labelled?: boolean; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(slug);
  return (
    <button
      type="button"
      className={`${styles.button} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? "Favorilerden çıkar" : "Favorilere ekle"}
      onClick={(e) => {
        // Cards are links: don't navigate when saving.
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
    >
      <HeartIcon filled={saved} />
      {labelled && <span>{saved ? "Favorilerde" : "Favorilere ekle"}</span>}
    </button>
  );
}
