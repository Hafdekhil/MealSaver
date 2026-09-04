import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import logoHorizontal from "../assets/logo-horizontal.png";

export function Header() {
  const location = useLocation();
  const { authState, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isCheckingSession = authState === "checking";

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("La déconnexion a échoué.");
      }

      setIsMenuOpen(false);
      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
    }
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="site-header" id="top">
      <NavLink
        className="brand"
        to="/"
        aria-label="Accueil MealSaver"
        onClick={closeMenu}
      >
        <img src={logoHorizontal} alt="MealSaver" />
      </NavLink>

      {(user || isMenuOpen) && (
        <nav
          id="main-navigation"
          className={`desktop-nav${isMenuOpen ? " open" : ""}${user ? "" : " guest-nav"}`}
          aria-label="Navigation principale"
        >
          <NavLink to="/" onClick={closeMenu}>
            Accueil
          </NavLink>

          {user ? (
            <>
              <NavLink to="/household" onClick={closeMenu}>
                Foyer
              </NavLink>
              <NavLink to="/inventory" onClick={closeMenu}>
                Inventaire
              </NavLink>
              <button
                type="button"
                className="mobile-nav-logout"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </>
          ) : (
            <>
              {location.pathname !== "/login" && (
                <NavLink to="/login" onClick={closeMenu}>
                  Se connecter
                </NavLink>
              )}
              {location.pathname !== "/register" && (
                <NavLink to="/register" onClick={closeMenu}>
                  Créer un compte
                </NavLink>
              )}
            </>
          )}
        </nav>
      )}

      <div className="header-actions">
        {!isCheckingSession && user ? (
          <>
            <span className="header-user" title={user.email}>
              {user.name}
            </span>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </>
        ) : !isCheckingSession ? (
          <>
            {location.pathname !== "/" && (
              <NavLink className="btn btn-ghost" to="/">
                Accueil
              </NavLink>
            )}

            {location.pathname !== "/login" && (
              <NavLink className="btn btn-ghost" to="/login">
                Se connecter
              </NavLink>
            )}

            {location.pathname !== "/register" && (
              <NavLink className="btn btn-primary" to="/register">
                Créer un compte
              </NavLink>
            )}
          </>
        ) : null}
      </div>

      <button
        type="button"
        className="menu-toggle"
        aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={isMenuOpen}
        aria-controls="main-navigation"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {isMenuOpen ? "×" : "☰"}
      </button>
    </header>
  );
}