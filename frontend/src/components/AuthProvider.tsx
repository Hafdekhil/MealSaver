import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./auth-context";
import type { AuthState, SessionUser } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAuthStatus() {
      try {
        const response = await fetch("/api/auth/status", {
          credentials: "include",
        });

        if (!active) return;

        if (!response.ok) {
          setUser(null);
          setAuthState("anonymous");
          return;
        }

        const data = await response.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
          setAuthState("authenticated");
        } else {
          setUser(null);
          setAuthState("anonymous");
        }
      } catch {
        if (active) {
          setUser(null);
          setAuthState("anonymous");
        }
      }
    }

    void loadAuthStatus();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authState, user }}>
      {children}
    </AuthContext.Provider>
  );
}