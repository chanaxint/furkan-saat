import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "solid" | "frame" | "line";

const cls = (variant: Variant, className = "") => `${styles.button} ${styles[variant]} ${className}`;

/**
 * House buttons: uppercase caps, square corners, never a pill.
 * `solid` for the one primary action on a page, `frame` for secondary, `line` for quiet links.
 */
export function Button({
  variant = "frame",
  className,
  children,
  ...rest
}: { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cls(variant, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "frame",
  external = false,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  /** Opens in a new tab (WhatsApp, maps). */
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (external || href.startsWith("mailto:") || href.startsWith("tel:"))
    return (
      <a href={href} className={cls(variant, className)} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls(variant, className)}>
      {children}
    </Link>
  );
}
