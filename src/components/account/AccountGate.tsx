"use client";

import { useEffect, useState } from "react";
import { signOut, useAccount } from "@/lib/services/account";
import { AuthScreen } from "./AuthScreen";
import styles from "./AuthScreen.module.css";

/** The account pages show only to a signed-in member; otherwise the sign-in screen. */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  // The account lives in this browser: render nothing until it has been read.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  // The bar samples what is beneath it on scroll: have it look again once the screen is in.
  useEffect(() => {
    if (ready) requestAnimationFrame(() => window.dispatchEvent(new Event("scroll")));
  }, [ready, account.signedIn]);
  if (!ready) return <div style={{ minHeight: "100svh" }} />;
  if (!account.signedIn) return <AuthScreen />;
  return (
    <>
      {children}
      <button type="button" className={styles.signOut} onClick={signOut}>
        Çıkış yap
      </button>
    </>
  );
}
