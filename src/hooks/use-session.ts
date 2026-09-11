import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { loadCurrentUser, type AppUser } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

export function useSession() {
  const qc = useQueryClient();

  const query = useQuery<AppUser | null>({
    queryKey: ["currentUser"],
    queryFn: () => loadCurrentUser(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        qc.setQueryData(["currentUser"], null);
      } else {
        void qc.invalidateQueries({ queryKey: ["currentUser"] });
      }
    });

    const onEvt = () => {
      void qc.invalidateQueries({ queryKey: ["currentUser"] });
    };
    window.addEventListener("mastercbc:auth", onEvt);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("mastercbc:auth", onEvt);
    };
  }, [qc]);

  return query.data ?? (query.isLoading ? undefined : null);
}
