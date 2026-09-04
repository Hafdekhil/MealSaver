import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
  const { authState } = useAuth();

  if (authState === "checking") {
    return (
      <main className="page-shell">
        <p>Vérification de la session...</p>
      </main>
    );
  }

  if (authState === "anonymous") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}