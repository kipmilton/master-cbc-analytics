import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth-store";
import type { MockUser } from "@/lib/mock-data";

export function useSession() {
  const [user, setUser] = useState<MockUser | null>(() => getSession());
  useEffect(() => {
    const sync = () => setUser(getSession());
    window.addEventListener("mastercbc:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mastercbc:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return user;
}
