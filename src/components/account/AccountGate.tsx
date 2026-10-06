"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { loginPath } from "@/lib/auth/redirect";

/**
 * Account pages are rendered only for a signed-in customer (checked on the
 * server by the proxy and the layout). This keeps watch in the browser: if
 * the session ends while a page is open — it expires, or the customer signs
 * out in another tab — it goes to the sign-in page, back here afterwards.
 */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const { status, expired, signedOutHere } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Signing out with "Çıkış yap" leads on by itself (AccountNav).
    if (status === "unauthenticated" && !signedOutHere)
      router.replace(loginPath(pathname, expired ? { oturum: "sona-erdi" } : undefined));
  }, [status, expired, signedOutHere, pathname, router]);

  // The bar samples what is beneath it on scroll: have it look again once the page is in.
  useEffect(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event("scroll")));
  }, []);

  return <>{children}</>;
}
