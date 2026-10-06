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

- Bu iki Supabase değeri tarayıcıya gider ve gizli değildir; kimin neyi
  okuyabileceğine veritabanındaki RLS karar verir.
- **`service_role` / secret anahtarını bu dosyaya, koda ya da GitHub'a
  koymayın.** Uygulamanın bugün buna ihtiyacı yok.
- `.env`, `.env.local` ve diğer `.env.*` dosyaları git'e girmez; yalnızca
  `.env.example` girer.

Değişkenler tanımlı değilken site normal çalışır; üyelik ekranları "Üyelik
sistemi şu anda hazırlanıyor" der.

## 2. Veritabanı

Supabase → SQL Editor'da sırayla çalıştırın:

1. `supabase/migrations/20261006120000_accounts.sql`: tablolar, RLS
   politikaları, tetikleyiciler, `create_order` fonksiyonu.
2. `supabase/seed/products.sql`: vitrin kataloğunun (`products.json`)
   veritabanındaki kopyası. Favoriler ve siparişler ürünlere bu tablo
   üzerinden bağlanır.
   - Katalog değiştiğinde `npm run db:products` ile dosyayı yeniden üretip
     tekrar çalıştırın. Komut slug'a göre günceller, tekrar çalıştırmak
     güvenlidir.

Supabase CLI kullanıyorsanız `supabase db push` aynı migration'ı uygular.

### RLS testleri

Yerel bir PostgreSQL (15+) üzerinde, iki müşteri ve bir ziyaretçiyle 57
saldırı/izin senaryosu:

```
PGHOST=… PGPORT=… PGUSER=postgres npm run db:test
```

`supabase/tests/00_supabase_stub.sql`, Supabase'in `auth` şemasını yalnızca
bu yerel test için taklit eder. **Supabase projesinde çalıştırmayın.**

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
