import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Impossible de se connecter.");
        return;
      }

      window.location.href = "/household";
    } catch {
      setError("Impossible de communiquer avec le serveur MealSaver.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-layout">
        <div className="auth-intro">
          <p className="eyebrow">MealSaver</p>
          <h1>Bon retour parmi nous.</h1>
          <p>
            Connectez-vous pour accéder à votre foyer, votre inventaire et vos
            outils MealSaver.
          </p>

          <ul className="auth-benefits">
            <li>Accéder à votre foyer</li>
            <li>Consulter votre inventaire</li>
            <li>Retrouver vos aliments et vos recettes</li>
          </ul>
        </div>

        <div className="auth-card">
          <h2>Connexion</h2>
          <p>Entrez votre courriel et votre mot de passe.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Courriel</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">Mot de passe</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              className="button button-primary button-large"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {error && (
            <p className="form-message form-error" role="alert">
              {error}
            </p>
          )}

          <p className="auth-switch">
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

