"use client";

import { useRef, useState, type ReactNode } from "react";
import { recordRequest } from "@/lib/services/account";
import { submitEnquiry, type EnquiryRequest, type EnquiryResult } from "@/lib/services/enquiries";
import { Form } from "./Form";
import { FormMessage } from "./FormMessage";

/**
 * Every enquiry form on the site: turns the answers into an EnquiryRequest
 * (`build`), hands it to the enquiry service and keeps a copy in the
 * customer's account. The result is shown above the (hidden) form, so
 * "edit" keeps the answers.
 */
export function EnquiryForm({
  build,
  submitLabel,
  children,
}: {
  build: (data: FormData) => EnquiryRequest;
  submitLabel: string;
  children: ReactNode;
}) {
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const top = useRef<HTMLDivElement>(null);

  return (
    <div ref={top} style={{ scrollMarginTop: "calc(var(--nav-h) + 24px)" }}>
      {result && <FormMessage result={result} onReset={() => setResult(null)} />}
      <Form
        hidden={!!result}
        submitLabel={submitLabel}
        note="Bilgileriniz yalnızca talebinizi yanıtlamak için kullanılır."
        onValid={async (data) => {
          const request = build(data);
          setResult(await submitEnquiry(request));
          recordRequest(request);
          top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        }}
      >
        {children}
      </Form>
    </div>
  );
}
