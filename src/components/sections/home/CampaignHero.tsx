import Image from "next/image";
import Link from "next/link";
import styles from "./CampaignHero.module.css";

/**
 * CAMPAIGN — the shop's front window after the opening: a full-width
 * photograph with the house name set huge *behind* the model (the photo, the
 * lettering, then a cut-out of the model on top), the season's line and a
 * way into the collection.
 */
export function CampaignHero() {
  return (
    <section className={styles.hero} data-nav-theme="light" aria-label="Yeni sezon">
      <div className={styles.frame}>
        <Image
          src="/assets/images/campaign/zamansiz.webp"
          alt="Bileğinde altın ve çelik tonlarında dikdörtgen kasalı bir saat taşıyan kadın"
          fill
          sizes="100vw"
          className={styles.photo}
        />
        <p className={styles.giant} aria-hidden>
          Furkan
        </p>
        <Image src="/assets/images/campaign/zamansiz-model.webp" alt="" fill sizes="100vw" className={styles.photo} aria-hidden />
      </div>
      <div className={styles.copy}>
        <p className={styles.line}>Yeni sezon saatler</p>
        <p className={styles.line}>Sınırlı sayıda</p>
        <Link href="/koleksiyon" className={styles.button}>
          Alışverişe başla
        </Link>
      </div>
      <p className={styles.slogan}>zamansız, zarif &amp; size özel.</p>
    </section>
  );
}
