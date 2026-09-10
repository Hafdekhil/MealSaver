import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/auth-context";

import styleReferenceBoard from "../assets/style-reference-board.png";

type Household = {
  id: number;
  name: string;
  role: "OWNER" | "MEMBER";
};

type ExpirationAlert = {
  foodItemId: number;
  name: string;
  expiresAt: string;
  daysRemaining: number;
  status: "EXPIRED" | "TODAY" | "SOON";
  message: string;
  householdId: number;
  householdName: string;
};

export function HomePage() {
  const { authState } = useAuth();
  const isAuthenticated = authState === "authenticated";

  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [alertsError, setAlertsError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let active = true;

    async function loadAlerts() {
      try {
        const householdResponse = await fetch("/api/households", {
          credentials: "include",
        });

        const householdData = await householdResponse.json();

        if (!householdResponse.ok) {
          throw new Error(
            householdData.error ?? "Impossible de charger les foyers.",
          );
        }

        const households = householdData.households as Household[];

        const alertGroups = await Promise.all(
          households.map(async (household) => {
            const response = await fetch(
              `/api/alerts?householdId=${household.id}`,
              {
                credentials: "include",
              },
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.error ?? "Impossible de charger les alertes.",
              );
            }

            return (data.alerts as Omit<
              ExpirationAlert,
              "householdId" | "householdName"
            >[]).map((alert) => ({
              ...alert,
              householdId: household.id,
              householdName: household.name,
            }));
          }),
        );

        const orderedAlerts = alertGroups
          .flat()
          .sort((a, b) => a.daysRemaining - b.daysRemaining);

        if (active) {
          setAlerts(orderedAlerts);
          setAlertsError("");
        }
      } catch (error) {
        if (active) {
          setAlertsError(
            error instanceof Error
              ? error.message
              : "Impossible de charger les alertes.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingAlerts(false);
        }
      }
    }

    void loadAlerts();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return (
    <main className="page-main">
      <section className="mp-hero section-wrap">
        <div className="mp-hero-copy reveal">
          <p className="kicker">
            MealSaver · Gestion alimentaire du foyer
          </p>

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
                  <Link
                    className="btn btn-primary btn-xl"
                    to="/household"
                  >
                    Accéder à mon foyer
                  </Link>

                  <Link
                    className="btn btn-soft btn-xl"
                    to="/inventory"
                  >
                    Voir mon inventaire
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    className="btn btn-primary btn-xl"
                    to="/register"
                  >
                    Créer un compte
                  </Link>

                  <Link
                    className="btn btn-soft btn-xl"
                    to="/login"
                  >
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

      {isAuthenticated && (
        <section className="section-wrap">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="kicker">Alertes d'expiration</p>
                <h2>Aliments à consommer en priorité</h2>
              </div>

              <span className="status urgent">
                {alerts.length} alerte
                {alerts.length > 1 ? "s" : ""}
              </span>
            </div>

            {isLoadingAlerts ? (
              <p>Chargement des alertes...</p>
            ) : alertsError ? (
              <p role="alert">{alertsError}</p>
            ) : alerts.length === 0 ? (
              <p>
                Aucun aliment n'approche de sa date d'expiration.
              </p>
            ) : (
              <div className="alert-feed">
                {alerts.map((alert) => (
                  <article
                    className="alert-row"
                    key={`${alert.householdId}-${alert.foodItemId}`}
                  >
                    <div>
                      <strong>{alert.name}</strong>

                      <small>
                        {alert.message}
                        {" · "}
                        {alert.householdName}
                      </small>
                    </div>

                    <div>
                      <span className="status urgent">
                        {alert.daysRemaining < 0
                          ? "Expiré"
                          : alert.daysRemaining === 0
                            ? "Aujourd'hui"
                            : alert.daysRemaining === 1
                              ? "1 jour"
                              : `${alert.daysRemaining} jours`}
                      </span>

                      <Link
                        className="btn btn-soft"
                        to={`/inventory?householdId=${alert.householdId}&item=${alert.foodItemId}`}
                      >
                        Voir l'aliment
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
          <h3>
            Organiser ensemble les aliments de la maison.
          </h3>
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

          <h3>
            {isAuthenticated ? "Mon espace" : "Compte"}
          </h3>

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