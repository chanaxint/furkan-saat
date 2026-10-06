"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { setFavoritesUser } from "@/lib/services/wishlist";
import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  /** The session ended without the visitor signing out (expired or revoked elsewhere). */
  expired: boolean;
  /** The visitor chose to sign out here (pages then lead on themselves, not back to sign-in). */
  signedOutHere: boolean;
  /** Supabase is set up in this environment. */
  available: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  status: "loading",
  user: null,
  expired: false,
  signedOutHere: false,
  available: supabaseConfigured,
  signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);

/**
 * The visitor's sign-in, for the whole site. Supabase restores the session
 * from its cookie on load (a reload keeps you signed in), refreshes the token
 * by itself, and reports every change through onAuthStateChange — the single
 * source this state follows. This state shapes the interface only: what data
 * a visitor may read is decided by the database's RLS.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(supabaseConfigured ? "loading" : "unauthenticated");
  const [user, setUser] = useState<User | null>(null);
  const [expired, setExpired] = useState(false);
  const [signedOutHere, setSignedOutHere] = useState(false);
  const leaving = useRef(false);
  const hadUser = useRef(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      setStatus(next ? "authenticated" : "unauthenticated");
      if (next) {
        setExpired(false);
        setSignedOutHere(false);
      }
      // Signed out by the server or another tab, not by this visitor here.
      if (event === "SIGNED_OUT" && hadUser.current && !leaving.current) setExpired(true);
      leaving.current = false;
      hadUser.current = Boolean(next);
      // Defer: never await Supabase calls inside this callback.
      setTimeout(() => setFavoritesUser(next?.id ?? null), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    leaving.current = true;
    setSignedOutHere(true);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ status, user, expired, signedOutHere, available: supabaseConfigured, signOut }),
    [status, user, expired, signedOutHere, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
