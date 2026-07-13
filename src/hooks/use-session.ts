import { useEffect, useState } from "react";
import { getSession, refreshSessionFromSupabase } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import type { AppUser } from "@/lib/auth-store";

export function useSession() {
  const [user, setUser] = useState<AppUser | null | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return getSession();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStoredSession = () => setUser(getSession());
    syncStoredSession();

    if (!getSession()) {
      void refreshSessionFromSupabase().then((refreshed) => {
        if (refreshed) setUser(refreshed);
      });
    }

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(getSession());
      } else {
        setUser(null);
      }
    });

    window.addEventListener("mastercbc:auth", syncStoredSession);
    window.addEventListener("storage", syncStoredSession);

    return () => {
      window.removeEventListener("mastercbc:auth", syncStoredSession);
      window.removeEventListener("storage", syncStoredSession);
      authSubscription?.subscription.unsubscribe();
    };
  }, []);

  return user;
}
