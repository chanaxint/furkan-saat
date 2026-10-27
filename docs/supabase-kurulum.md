# Üyelik sistemi — Supabase kurulumu

Furkan Saat üyelikleri Supabase Auth ile çalışır. Profil, adres, sipariş ve
favoriler Supabase PostgreSQL'de, Row Level Security (RLS) altında tutulur.
Şifreler yalnızca Supabase Auth'ta, onun tarafından şifrelenmiş (hash) olarak
saklanır; bu projenin tablolarında şifre yoktur.

## 1. Ortam değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayın ve doldurun:

| Değişken | Nereden |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → **Publishable key** (`sb_publishable_…`). Eski projelerde "anon public" anahtarı: o zaman değişkenin adı `NEXT_PUBLIC_SUPABASE_ANON_KEY` olsun. |
| `NEXT_PUBLIC_SITE_URL` | Sitenin adresi. Geliştirmede `http://localhost:4321` (`npm run preview`) ya da `http://localhost:3000` (`npm run dev`); yayında `https://furkansaat.com`. |
| `CATALOG_SOURCE` | `json` (varsayılan) ya da `db`. Veritabanı hazırlanıp doğrulanmadan `db` yapmayın (bölüm 7). Gizli değildir. |

- Bu iki Supabase değeri tarayıcıya gider ve gizli değildir; kimin neyi
  okuyabileceğine veritabanındaki RLS karar verir.
- Yeni biçimli publishable anahtar (`sb_publishable_…`) katalog okumalarında
  yalnızca `apikey` başlığıyla gönderilir; JWT olmadığı için `Authorization`
  başlığına konmaz. Eski JWT biçimli anon anahtarı ayrıca `Authorization:
  Bearer` olarak da gönderilir (`@supabase/supabase-js` ile aynı).
- **`service_role` / secret anahtarını bu dosyaya, koda ya da GitHub'a
  koymayın.** Uygulamanın bugün buna ihtiyacı yok.
- `.env`, `.env.local` ve diğer `.env.*` dosyaları git'e girmez; yalnızca
  `.env.example` girer.

Değişkenler tanımlı değilken site normal çalışır; üyelik ekranları "Üyelik
sistemi şu anda hazırlanıyor" der.

## 2. Veritabanı kurulumu

> **Doğrulama durumu:** Bu adımlar yalnızca yerel PostgreSQL ve testlerdeki
> Supabase taklidiyle denendi. Gerçek bir Supabase projesinde henüz hiç
> uygulanmadı; ilk uygulama bir **test projesinde** yapılmalı ve sonuçları
> bölüm 8'deki listeyle kontrol edilmelidir.

Gerçek veri olan bir projede başlamadan önce yedek alın (Supabase paneli →
Database → Backups ya da `pg_dump`). Aşağıdaki iki yoldan **birini** seçin.

### Migration'ların sırası (iki yol için de aynı)

1. `supabase/migrations/20261006120000_accounts.sql`: müşteri tabloları, RLS
   politikaları, tetikleyiciler, `create_order` fonksiyonu.
2. `supabase/migrations/20261026120000_admin_catalog.sql`: yöneticiler
   (`admin_users`, `is_admin()`), katalog sütunları, slug yönlendirmeleri,
   değişiklik kaydı, `product-images` bucket'ı ve politikaları.
3. `supabase/migrations/20261027090000_product_admin_edits.sql`: ürünü son
   düzenleyen yöneticiyi herkese açık ürün tablosundan çıkarır.

Ardından seed: `supabase/seed/products.sql` (`products.json`'daki 106 saat).
Slug'a göre günceller; kimlikler değişmez, hiçbir şey silinmez, yöneticinin
panelden düzenlediği ürünlere dokunulmaz. Dosya üç migration'ın da uygulanmış
olmasını bekler. Yeniden üretmek için `npm run db:products` (Node 22.18+).

### Yol A — SQL Editor (önerilen)

Komut satırı gerektirmez.

1. Supabase paneli → **SQL Editor** → **New query**.
2. `supabase/migrations/20261006120000_accounts.sql` dosyasının tamamını
   yapıştırın → **Run**. Hata olmadan bittiğini görün.
3. Aynı şekilde `20261026120000_admin_catalog.sql` → **Run**.
4. Aynı şekilde `20261027090000_product_admin_edits.sql` → **Run**.
5. `supabase/seed/products.sql` → **Run**.
6. Kontrol için yeni bir sorguda çalıştırın; 106 dönmelidir:

   ```sql
   select count(*) from public.products where is_active;
   ```

Her dosya bir kez çalıştırılır. Bir migration'ı ikinci kez çalıştırmak hata
verir (tablolar zaten vardır); seed ise tekrar çalıştırılabilir.

### Yol B — Supabase CLI (isteğe bağlı)

Bu depoda CLI yapılandırması **yoktur**: `supabase/config.toml` dosyası
bulunmaz ve depo hiçbir Supabase projesine bağlı değildir. Bu nedenle
`supabase db push` olduğu gibi **çalışmaz**; önce projenin bağlanması gerekir.
Supabase CLI belgelerine göre sıra şöyledir (bu projede denenmedi):

1. Supabase CLI'yi kurun ve `supabase login` ile giriş yapın (hesap erişim
   anahtarı ister; bu anahtarı depoya koymayın).
2. Proje klasöründe `supabase init`: `supabase/config.toml` oluşturur. Mevcut
   `supabase/migrations/` klasörü olduğu gibi kullanılır.
3. `supabase link --project-ref <proje-kimliği>`: veritabanı parolasını ister.
4. `supabase db push`: `supabase/migrations/` içindeki migration'ları zaman
   damgası sırasıyla uygular.
5. Seed'i ayrıca çalıştırın: `supabase/seed/products.sql`, CLI'nin varsayılan
   seed konumunda değildir; en güvenlisi Yol A'nın 5. adımı gibi SQL Editor'da
   çalıştırmaktır.

`supabase/rollback/` klasörünü CLI okumaz; geri dönüş dosyaları yalnızca elle,
yeniden eskiye doğru (önce `20261027…`, sonra `20261026…`) ve yedek alındıktan
sonra çalıştırılır. `20261006…` (müşteri hesapları) için geri dönüş dosyası
yoktur: geri almak müşteri verisini siler.

### RLS testleri

Yerel bir PostgreSQL (15+) üzerinde; müşteri, yönetici ve ziyaretçi
senaryoları, seed ve geri dönüş dosyaları (`supabase/tests/`):

```
PGHOST=… PGPORT=… PGUSER=postgres npm run db:test
```

`supabase/tests/00_supabase_stub.sql`, Supabase'in `auth` şemasını yalnızca
bu yerel test için taklit eder. **Supabase projesinde çalıştırmayın.**

Uygulanan migration'lardan sonra (Node 22.18+):

```
npm run catalog:verify -- --supabase
```

veritabanındaki katalogu `products.json` ile alan alan karşılaştırır; yalnızca
okur ve anahtar yazdırmaz. "Katalog birebir aynı" görmeden `CATALOG_SOURCE=db`
yapmayın (bölüm 7).

## 3. Authentication ayarları (Supabase paneli)

**Authentication → URL Configuration**

- Site URL: `https://furkansaat.com`
- Redirect URLs:
  - `http://localhost:4321/**`
  - `http://localhost:3000/**`
  - `https://furkansaat.com/**`
  - Varsa önizleme adresleri.

**Authentication → Sign In / Providers → Email**

- Email provider açık.
- "Confirm email" açık. Kayıttan sonra e-posta doğrulaması zorunlu olur.
- Minimum password length: **8** (site de en az 8 karakter, harf ve rakam
  ister).

**Authentication → Emails → Templates**

Bağlantıların her cihazda çalışması için (e-posta başka bir telefonda
açılsa bile) şablonlardaki bağlantıyı şöyle değiştirin:

- Confirm signup:
  `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">E-postamı doğrula</a>`
- Reset password:
  `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Şifremi yenile</a>`

`{{ .RedirectTo }}` sitenin gönderdiği adrestir:
`…/auth/callback?next=…`. Böylece müşteri doğrulamadan sonra gitmek istediği
sayfaya döner. Varsayılan şablonlar da çalışır, ama bağlantının aynı
tarayıcıda açılması gerekir.

**SMTP (yayından önce şart).** Supabase'in yerleşik e-posta servisi saatte
birkaç e-postayla sınırlıdır ve yalnızca deneme içindir. Yayında
Authentication → Emails → SMTP Settings'e kendi SMTP sağlayıcınızı girin
(ör. Resend, Postmark, Amazon SES) ve gönderen adresini
`noreply@furkansaat.com` gibi bir adres yapın.

## 4. Akışlar

| Akış | Yol |
| --- | --- |
| Giriş / kayıt | `/giris` (`?sekme=uye-ol`, `?next=/hesap/...`) |
| E-posta doğrulama, şifre sıfırlama bağlantıları, ileride Google | `/auth/callback` |
| Şifremi unuttum | `/sifremi-unuttum` → e-posta → `/sifre-yenile` → `/hesap` |
| Hesabım | `/hesap` (Profilim), `/hesap/adresler`, `/hesap/siparisler`, `/hesap/favoriler`, `/hesap/talepler` |

- **Koruma:** `src/proxy.ts`, `/hesap/*` sayfalarına oturumsuz gelenleri
  `/giris?next=…` adresine yönlendirir. Hesap düzeni sunucuda tekrar kontrol
  eder. Asıl güvenlik veritabanındaki RLS'tir.
- **Oturum:** çerezde tutulur, sayfa yenilenince korunur ve kendiliğinden
  yenilenir. Süresi dolarsa ya da başka yerden kapatılırsa müşteri "Oturumunuzun
  süresi doldu" notuyla giriş sayfasına gelir.

## 5. Google ile giriş (ileride)

1. Supabase → Authentication → Providers → Google'ı açın ve Google Cloud'dan
   OAuth istemci kimliğini girin.
2. Giriş ekranına bir düğme ekleyin:
   `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: \`${siteUrl()}/auth/callback?next=/hesap\` } })`

`/auth/callback` bu dönüşü (`?code=`) zaten karşılar. Yeni kullanıcıların
profili aynı tetikleyiciyle oluşur. Google ad/soyadı `full_name` olarak
gönderdiği için gerekirse `handle_new_user` fonksiyonu bunu da okuyacak
şekilde genişletilebilir.

## 6. Siparişler (ödeme bağlandığında)

- Müşteriler siparişlerini yalnızca okuyabilir; doğrudan yazamaz.
- Sipariş `create_order(items, address_id)` veritabanı fonksiyonuyla
  oluşturulur (`src/lib/services/customer.ts → createOrder`):
  - Fiyat, ad ve görsel sunucuda `products` tablosundan alınır ve
    `order_items` içine kopyalanır (snapshot).
  - Seçilen adres siparişe kopyalanır.
  - Sipariş `pending_payment` durumunda başlar.
- Ödeme sağlayıcısının webhook'u durumu (`paid`, `preparing`, `shipped`,
  `delivered`…) yalnızca sunucu tarafında, service role ile günceller. Bu
  anahtar sadece sunucu ortam değişkeninde (`NEXT_PUBLIC_` öneki olmadan)
  durmalıdır.

## 7. Katalog ve yönetim paneli

`CATALOG_SOURCE` sitenin saatleri nereden okuduğunu belirler:

| Değer | Katalog | Yönetim paneli (`/yonetim`) |
| --- | --- | --- |
| `json` (varsayılan; tanımsız da `json`) | `src/lib/data/products.json` | Yalnızca `npm run dev` ile; dosyaya yazar |
| `db` | Supabase `public.products` (yalnızca aktif saatler) | Canlı sitede de; yöneticinin oturumuyla, RLS üzerinden yazar |

Gereken ortam değişkenleri:

| Mod | Gerekli | Not |
| --- | --- | --- |
| `json` | Hiçbiri | Supabase değişkenleri yoksa site çalışır; üyelik ekranları "hazırlanıyor" der, panel açılmaz (yönetici girişi gerekir) |
| `db` | `CATALOG_SOURCE=db`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ya da eski projelerde `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `NEXT_PUBLIC_SITE_URL` | Service role anahtarı **gerekmez** |

- `db` ile Supabase ayarları eksikse build açık bir hatayla durur; site
  sessizce JSON'a dönmez.
- Panel (`/yonetim`) her iki modda da yalnızca yöneticilere açıktır; yerelde
  `npm run dev` ile de yönetici girişi gerekir.

### Yönetici hesabı oluşturma

Yönetici rolü `user_metadata`'da değil, yalnızca `public.admin_users`
tablosunda tutulur; bu tabloya siteden yazılamaz, yalnızca SQL Editor'dan.

1. Yönetici olacak kişi siteden normal bir müşteri gibi üye olur (`/giris` →
   Üye Ol) ve e-posta doğrulama bağlantısına tıklar.
2. Supabase paneli → **SQL Editor**'da, e-posta adresini yazarak:

   ```sql
   insert into public.admin_users (user_id, role)
   select id, 'owner' from auth.users where email = 'YONETICI@ORNEK.COM';
   ```

3. Kontrol (yönetici burada listelenmiyorsa o e-postayla bir üye yoktur ya da
   e-posta farklı yazılmıştır):

   ```sql
   select u.email, a.role, a.created_at
     from public.admin_users a join auth.users u on u.id = a.user_id;
   ```
4. Kişi sitede çıkış yapıp yeniden giriş yapar ve `/yonetim` adresini açar.
   Yetki her istekte veritabanından okunur.
5. Yetkiyi kaldırmak için:

   ```sql
   delete from public.admin_users
    where user_id = (select id from auth.users where email = 'YONETICI@ORNEK.COM');
   ```

   Etkisi bir sonraki istekte başlar; açık oturum panele giremez.

Diğer notlar:
- `db` modunda panelde "Sil" saati silmez, arşivler (`is_active = false`):
  müşterilerin favorileri ve geçmiş siparişleri korunur. Slug değiştirilirse
  eski adres kalıcı olarak yeni adrese yönlenir.
- Önbellek: panelden yapılan başarılı bir değişiklik katalog önbelleğini hemen
  geçersiz kılar (`revalidateTag("catalog", { expire: 0 })`). SQL Editor'dan
  veya seed ile yapılan değişiklikler en geç 5 dakika içinde görünür. Panelden
  sonradan eklenen bir saatin sayfası yeni build gerekmeden açılır.
- Henüz yalnızca geliştirme modunda olanlar: fotoğraf yükleme (Supabase
  Storage'a bağlanacak), iletişim/banka ayarları ve 3D dönüşler.
- Eski adres yönlendirmeleri (`product_slug_redirects`) adres başına değil, tek
  bir sorguyla okunur ve katalogla aynı önbellekte tutulur: bilinmeyen adresleri
  ziyaret etmek veritabanına her seferinde sorgu göndermez. Veritabanı
  okunamazsa sayfa hata verir (500); "saat bulunamadı" (404) gibi gösterilmez.
- REST API'nin satır sınırı (Supabase'de varsayılan 1000) yüzünden eksik gelen
  bir ürün veya yönlendirme listesi hata verir; sessizce eksik gösterilmez.
- **Bilinen 404 davranışı (Next.js 16.3.6):** Olmayan bir `/saat/...` adresi 404
  durum koduyla ve `noindex` ile döner, sayfa tarayıcıda normal 404 sayfası
  olarak görünür; ancak sunucunun gönderdiği HTML'de 404 içeriği yoktur, sayfayı
  JavaScript çizer. Next, render sırasında çağrılan `notFound()` için yalnızca
  boş bir HTML kabuğu gönderir. Önceden üretilen 404 sayfası yalnızca hiçbir
  rotanın eşleşmediği adreslerde tam HTML'dir (ör. `/olmayan-sayfa`). Panelden
  eklenen saatlerin yeni build olmadan açılabilmesi bu davranışla birlikte
  seçildi; `proxy` ile ön kontrol, 16.3.6'da her istekte katalog sorgusu
  gerektirdiği için uygulanmadı. Her yeni bilinmeyen adres önbellekte bir 404
  kaydı oluşturur (veritabanı sorgusu oluşturmaz).
- Veritabanında eksik alanlı (bozuk) bir ürün satırı, katalog okumasını
  durdurur: yeni build başarısız olur, mevcut sayfalar önbellekten sunulmaya
  devam eder. Satırlar sessizce atlanmaz; ürünleri SQL Editor yerine panelden
  düzenleyin (panel tüm alanları doğrular).

Geçiş sırası: migration'lar → seed → `npm run catalog:verify -- --supabase` →
ilk yönetici → `CATALOG_SOURCE=db` ile yeniden deploy. Geri dönmek için
`CATALOG_SOURCE=json` yapıp yeniden deploy etmek yeterlidir; veritabanı
değişmez.

## 8. Gerçek projede henüz doğrulanmamış olanlar

Kod ve testler yalnızca yerel PostgreSQL ve Supabase taklidiyle denendi. Bir
test projesinde şunlar kontrol edilmeden `CATALOG_SOURCE=db` canlıya
alınmamalıdır:

- Migration'ların hosted Supabase'de hatasız uygulanması; özellikle
  `storage.buckets`'a kayıt ve `storage.objects` üzerinde politika oluşturma.
- `npm run catalog:verify -- --supabase` sonucunun "Katalog birebir aynı"
  olması (publishable anahtarın yalnızca `apikey` başlığıyla kabul edildiğini de
  gösterir).
- Giriş: oturum doğrulaması (`getClaims`, JWKS) ve `is_admin` RPC'si; müşteri
  hesabıyla `/yonetim` 404, yönetici hesabıyla açılmalı.
- Panelden ekleme, düzenleme, slug değiştirme ve silme (arşivleme); sitede
  hemen görünmesi ve eski adresin yeni adrese yönlenmesi.
- Hata kodları ve RLS davranışı (yönetici olmayan yazamaz), `count=exact`
  ile satır sayısının gelmesi.
- Storage: bucket ayarları (15 MB, yalnızca fotoğraf türleri) ve politikalar.
  Uygulama henüz Storage'a yükleme yapmıyor.
- Gerçek alan adıyla panel istekleri (Origin kontrolü; `www` ve `www`'suz).
