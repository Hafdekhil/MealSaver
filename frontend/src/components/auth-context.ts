import { createContext, useContext } from "react";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export type AuthState = "checking" | "authenticated" | "anonymous";

export type AuthContextValue = {
  authState: AuthState;
  user: SessionUser | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider");
  }

  return context;
}