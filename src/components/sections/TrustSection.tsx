import { Assurances } from "@/components/product/Assurances";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitText } from "@/components/ui/SplitText";
import styles from "./TrustSection.module.css";

/** 04 — TRUST. What every watch carries with it, in four short promises. */
export function TrustSection() {
  return (
    <section className={styles.section} data-nav-theme="light" aria-label="Güvence">
      <div className="container">
        <header className={styles.header}>
          <SectionMarker index="04" label="Güvence" />
          <SplitText text={"Her saat,\n*bir* *söz.*"} className={`t-display ${styles.heading}`} />
        </header>
        <Assurances />
      </div>
    </section>
  );
}
