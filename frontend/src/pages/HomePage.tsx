import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

import styleReferenceBoard from "../assets/style-reference-board.png";

export function HomePage() {
  const { authState } = useAuth();
  const isAuthenticated = authState === "authenticated";

  return (
    <main className="page-main">
      <section className="mp-hero section-wrap">
        <div className="mp-hero-copy reveal">
          <p className="kicker">MealSaver · Gestion alimentaire du foyer</p>

          <h1>
            Mieux gérer ses aliments. Réduire le gaspillage alimentaire.
          </h1>

          <p className="lead">
            MealSaver aide les membres du foyer à organiser les aliments
            disponibles et à gérer ensemble leur inventaire alimentaire.
          </p>

          {authState !== "checking" && (
            <div className="hero-actions">
              {isAuthenticated ? (
                <>
                  <Link className="btn btn-primary btn-xl" to="/household">
                    Accéder à mon foyer
                  </Link>

                  <Link className="btn btn-soft btn-xl" to="/inventory">
                    Voir mon inventaire
                  </Link>
                </>
              ) : (
                <>
                  <Link className="btn btn-primary btn-xl" to="/register">
                    Créer un compte
                  </Link>

                  <Link className="btn btn-soft btn-xl" to="/login">
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="mp-pills">
            <span>👤 Compte utilisateur</span>
            <span>🏠 Gestion du foyer</span>
            <span>🥬 Inventaire partagé</span>
          </div>
        </div>

        <div className="mp-visual reveal delay-1">
          <div className="mp-device-card">
            <img
              src={styleReferenceBoard}
              alt="Aperçu des écrans MealSaver"
            />
          </div>
        </div>
      </section>

      <section className="section-wrap mp-photo-grid">
        <article
          className="mp-photo-tile big"
          style={{
            "--img":
              "url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=85')",
          } as CSSProperties}
        >
          <span>Inventaire alimentaire</span>
          <h2>Savoir ce que l’on a déjà à la maison.</h2>
        </article>

        <article
          className="mp-photo-tile"
          style={{
            "--img":
              "url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85')",
          } as CSSProperties}
        >
          <span>Gestion du foyer</span>
          <h3>Organiser ensemble les aliments de la maison.</h3>
        </article>

        <article
          className="mp-photo-tile"
          style={{
            "--img":
              "url('https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=900&q=85')",
          } as CSSProperties}
        >
          <span>Compte utilisateur</span>
          <h3>Créer son espace et accéder à MealSaver.</h3>
        </article>
      </section>

      <section className="section-wrap mp-section-preview">
        <Link to={isAuthenticated ? "/household" : "/register"}>
          <strong>01</strong>
          <h3>{isAuthenticated ? "Mon espace" : "Compte"}</h3>
          <p>
            {isAuthenticated
              ? "Accéder à votre foyer et poursuivre votre utilisation de MealSaver."
              : "Créer un compte utilisateur, se connecter et se déconnecter de MealSaver."}
          </p>
        </Link>

        <Link to="/household">
          <strong>02</strong>
          <h3>Foyer</h3>
          <p>
            Créer un foyer, inviter un membre et consulter les membres du
            foyer.
          </p>
        </Link>

        <Link to="/inventory">
          <strong>03</strong>
          <h3>Inventaire</h3>
          <p>
            Ajouter, modifier et supprimer les aliments enregistrés dans
            l’inventaire du foyer.
          </p>
        </Link>
      </section>
    </main>
  );
}
