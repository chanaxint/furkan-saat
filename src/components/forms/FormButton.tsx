import { Button } from "@/components/ui/Button";
import type { ReactNode } from "react";

/** The form's one solid action; shows that it is working while the request is prepared. */
export function FormButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" variant="solid" disabled={pending} aria-busy={pending}>
      {pending ? "Hazırlanıyor…" : children}
    </Button>
  );
}
