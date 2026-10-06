/** Sign-up and password rules, checked in the browser before anything is sent (Supabase checks again). */
export const PASSWORD_MIN = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validEmail = (v: string) => EMAIL.test(v.trim());

/** An error message for a new password, or "" when it is acceptable. */
export function passwordProblem(v: string) {
  if (!v) return "Bir şifre belirleyin.";
  if (v.length < PASSWORD_MIN) return `Şifre en az ${PASSWORD_MIN} karakter olmalı.`;
  if (v.length > 72) return "Şifre en fazla 72 karakter olabilir.";
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(v) || !/\d/.test(v)) return "Şifrede en az bir harf ve bir rakam olmalı.";
  return "";
}
