import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import type { AppUser } from "@/lib/auth-store";

export function useSession() {
  const [user, setUser] = useState<AppUser | null>(() => getSession());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStoredSession = () => setUser(getSession());
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
