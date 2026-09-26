import type { Metadata } from "next";
import { SeatControl } from "@/components/tools/SeatControl";

export const metadata: Metadata = {
  title: "Saat Konumu — Kontrol",
  robots: { index: false, follow: false },
};

/** Internal tool: place the 3D watch on the cushion of the opening footage. */
export default function KontrolPage() {
  return <SeatControl />;
}
