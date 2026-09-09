import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";
import logoHorizontal from "../assets/logo-horizontal.png";

export function Header() {
  const location = useLocation();
  const { authState, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isCheckingSession = authState === "checking";

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("La d\u00E9connexion a \u00E9chou\u00E9.");
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

              <NavLink to="/scan" onClick={closeMenu}>
                Scan
              </NavLink>

              <NavLink to="/recipes" onClick={closeMenu}>
                Recettes
              </NavLink>

              <button
                type="button"
                className="mobile-nav-logout"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "D\u00E9connexion..." : "Se d\u00E9connecter"}
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
                  {"Cr\u00E9er un compte"}
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
              {isLoggingOut ? "D\u00E9connexion..." : "Se d\u00E9connecter"}
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
                {"Cr\u00E9er un compte"}
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
        {isMenuOpen ? "\u00D7" : "\u2630"}
      </button>
    </header>
  );
}
