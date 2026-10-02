import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { readSettings } from "@/lib/admin/store";
import styles from "@/components/admin/admin.module.css";

export default async function AdminSettingsPage() {
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>İletişim ve banka</h1>
          <p className={styles.lede}>Bu bilgiler sitenin her yerinde kullanılır: WhatsApp butonları, footer, iletişim sayfası ve havale talimatları.</p>
        </div>
      </header>
      <SettingsEditor settings={await readSettings()} />
    </>
  );
}
