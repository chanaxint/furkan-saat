import { Assurances } from "@/components/product/Assurances";
import { SplitText } from "@/components/ui/SplitText";
import styles from "./TrustSection.module.css";

/** 04 — TRUST. What every watch carries with it, in four short promises. */
export function TrustSection() {
  return (
    <section className={styles.section} data-nav-theme="light" aria-label="Güvence">
      <div className="container">
        <header className={styles.header}>
          <SplitText text={"Her saat,\n*bir* *söz.*"} className={`t-display ${styles.heading}`} />
        </header>
        <Assurances />
      </div>
    </section>
  );
}
