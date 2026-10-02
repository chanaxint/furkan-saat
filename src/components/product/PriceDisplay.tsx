import type { Currency } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";

/** Prices are set quietly in the serif; "on request" reads as a sentence, not a badge. */
export function PriceDisplay({ price, currency, className }: { price: number | null; currency: Currency; className?: string }) {
  return (
    <span className={className} data-request={price === null || undefined}>
      {formatPrice(price, currency)}
    </span>
  );
}
