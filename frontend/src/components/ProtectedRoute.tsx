import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";

export function ProtectedRoute() {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState === "checking") {
    return (
      <main className="page-shell">
        <p>Vérification de la session...</p>
      </main>
    );
  }

  if (authState === "anonymous") {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return <Outlet />;
}