/** Calls an admin route and returns its JSON, throwing the route's message on failure. */
export async function adminFetch<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi.");
  return data;
}

export const putJson = (url: string, body: unknown) =>
  adminFetch(url, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export async function uploadImage(file: File, name: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("name", name);
  return (await adminFetch<{ path: string }>("/api/yonetim/gorsel", { method: "POST", body: form })).path;
}
