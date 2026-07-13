import { useEffect, useState } from "react";
import { loadCurrentUser, type AppUser } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

export function useSession() {
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const next = await loadCurrentUser();
      if (!cancelled) setUser(next);
    }
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { setUser(null); return; }
      refresh();
    });
    const onEvt = () => refresh();
    window.addEventListener("mastercbc:auth", onEvt);
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener("mastercbc:auth", onEvt);
    };
  }, []);

  return user;
}
