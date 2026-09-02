import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

type RegisteredUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const details =
          Array.isArray(data.details) && data.details.length > 0
            ? ` ${data.details.join(" ")}`
            : "";

        setError(`${data.error ?? "Impossible de créer le compte."}${details}`);
        return;
      }

      const user = data.user as RegisteredUser;

      setSuccess(`Compte créé avec succès pour ${user.email}.`);
      setName("");
      setEmail("");
      setPassword("");
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
          <p className="eyebrow">Bienvenue sur MealSaver</p>
          <h1>Créez votre compte.</h1>
          <p>
            Commencez par votre profil utilisateur. Vous pourrez ensuite créer
            votre foyer et gérer son inventaire.
          </p>

          <ul className="auth-benefits">
            <li>Un compte personnel sécurisé</li>
            <li>Un foyer partagé avec ses membres</li>
            <li>Un inventaire alimentaire centralisé</li>
          </ul>
        </div>

        <div className="auth-card">
          <h2>Créer un compte</h2>
          <p>Entrez vos informations pour commencer.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="register-name">Nom</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />

            <label htmlFor="register-email">Courriel</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="register-password">Mot de passe</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <p className="field-help">
              Minimum 8 caractères, avec une minuscule, une majuscule et un
              chiffre.
            </p>

            <button
              className="button button-primary button-large"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          {error && <p className="form-message form-error" role="alert">{error}</p>}
          {success && (
            <p className="form-message form-success" role="status">
              {success}
            </p>
          )}

          <p className="auth-switch">
            Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

