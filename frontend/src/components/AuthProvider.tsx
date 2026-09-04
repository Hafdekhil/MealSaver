import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

type AuthState = "checking" | "authenticated" | "anonymous";

type AuthContextValue = {
  authState: AuthState;
  user: SessionUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }

  return context;
}
