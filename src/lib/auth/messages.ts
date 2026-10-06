/**
 * Supabase Auth errors in the house's own words. Technical messages
 * ("Invalid login credentials") are never shown as they are.
 */
type AuthLikeError = { code?: string; status?: number; message?: string; name?: string } | null | undefined;

const BY_CODE: Record<string, string> = {
  invalid_credentials: "E-posta veya şifre hatalı.",
  email_not_confirmed: "E-posta adresinizi henüz doğrulamadınız. Size gönderdiğimiz bağlantıya tıklayın.",
  user_already_exists: "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  email_exists: "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  weak_password: "Şifreniz yeterince güçlü değil. En az 8 karakter; harf ve rakam kullanın.",
  same_password: "Yeni şifreniz eskisinden farklı olmalı.",
  over_email_send_rate_limit: "Çok sık e-posta istendi. Lütfen birkaç dakika sonra tekrar deneyin.",
  over_request_rate_limit: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.",
  otp_expired: "Bağlantının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.",
  flow_state_expired: "Bağlantının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.",
  flow_state_not_found: "Bağlantı bu tarayıcıda açılmadı. Lütfen yeni bir bağlantı isteyin.",
  session_expired: "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.",
  session_not_found: "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.",
  refresh_token_not_found: "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.",
  signup_disabled: "Yeni üyelikler şu anda kapalı.",
  email_address_invalid: "Geçerli bir e-posta adresi yazın.",
  validation_failed: "Bilgileri kontrol edip tekrar deneyin.",
};

export function authMessage(error: AuthLikeError) {
  if (!error) return "";
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.status === 429) return BY_CODE.over_request_rate_limit;
  if (error.name === "AuthRetryableFetchError" || error.status === 0) return "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  // Older servers send no code: recognise the common messages.
  const m = (error.message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return BY_CODE.invalid_credentials;
  if (m.includes("email not confirmed")) return BY_CODE.email_not_confirmed;
  if (m.includes("already registered")) return BY_CODE.user_already_exists;
  return "Bir sorun oluştu. Lütfen tekrar deneyin.";
}

/** Database / network errors on account pages. */
export const DATA_ERROR = "Bilgileriniz şu anda yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.";
export const SAVE_ERROR = "Değişiklik kaydedilemedi. Lütfen tekrar deneyin.";
