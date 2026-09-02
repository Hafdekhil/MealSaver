import { NavLink } from "react-router-dom";
import logoHorizontal from "../assets/logo-horizontal.png";

export function Header() {
  return (
    <header className="site-header" id="top">
      <NavLink className="brand" to="/" aria-label="Accueil MealSaver">
        <img src={logoHorizontal} alt="MealSaver" />
      </NavLink>

      <nav className="desktop-nav" aria-label="Navigation principale">
        <NavLink to="/">Accueil</NavLink>
        <NavLink to="/household">Foyer</NavLink>
        <NavLink to="/inventory">Inventaire</NavLink>
      </nav>

      <div className="header-actions">
        <NavLink className="btn btn-ghost" to="/login">
          Se connecter
        </NavLink>

        <NavLink className="btn btn-primary" to="/register">
          Créer un compte
        </NavLink>
      </div>
    </header>
  );
}
