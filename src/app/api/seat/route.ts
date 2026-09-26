import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { SEAT_FIELDS, type SeatConfig } from "@/lib/scene/seat";

/**
 * Saves the /kontrol page's values to src/lib/scene/seat.json.
 * Development only — the file system is read-only (and must stay untouched)
 * on the live site.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Kaydetme yalnızca geliştirme modunda (npm run dev) çalışır." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
  }

  // Accept exactly the known fields, as finite numbers within their ranges.
  const input = body as Record<string, unknown>;
  const out = {} as SeatConfig;
  for (const f of SEAT_FIELDS) {
    const v = input[f.key];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return NextResponse.json({ error: `Eksik ya da geçersiz değer: ${f.key}` }, { status: 400 });
    }
    out[f.key] = Math.min(f.max, Math.max(f.min, Math.round(v * 10000) / 10000));
  }

  const file = path.join(process.cwd(), "src", "lib", "scene", "seat.json");
  await fs.writeFile(file, JSON.stringify(out, null, 2) + "\n", "utf8");
  return NextResponse.json({ ok: true, seat: out });
}
