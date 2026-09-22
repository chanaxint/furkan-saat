import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./ArrowLink.module.css";

type Props = {
  href: string;
  children: ReactNode;
  /** `line` = underlined text link, `frame` = hairline-framed CTA. */
  variant?: "line" | "frame";
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">;

/** House CTA: uppercase caps + a travelling arrow. Never a rounded pill. */
export function ArrowLink({ href, children, variant = "line", className = "", ...rest }: Props) {
  return (
    <Link href={href} prefetch={false} className={`${styles.link} ${styles[variant]} ${className}`} {...rest}>
      <span className={styles.label}>{children}</span>
      <span className={styles.arrow} aria-hidden>
        <svg viewBox="0 0 28 10" width="28" height="10">
          <path d="M0 5h26M22 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </span>
    </Link>
  );
}
