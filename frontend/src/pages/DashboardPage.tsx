import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Household = {
  id: number;
  name: string;
  role: "OWNER" | "MEMBER";
};

type FoodItem = {
  id: number;
};

type ExpirationAlert = {
  foodItemId: number;
  name: string;
  expiresAt: string;
  daysRemaining: number;
  status: "EXPIRED" | "TODAY" | "SOON";
  message: string;
};

type AlertsResponse = {
  alerts: ExpirationAlert[];
  disabledByPreference?: boolean;
};

function formatAlertStatus(alert: ExpirationAlert) {
  if (alert.status === "EXPIRED") {
    return "Expiré";
  }

  if (alert.status === "TODAY") {
    return "Aujourd'hui";
  }

  if (alert.daysRemaining === 1) {
    return "1 jour";
  }

  return `${alert.daysRemaining} jours`;
}

export function DashboardPage() {
  const navigate = useNavigate();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState<number | null>(null);

  const [totalItems, setTotalItems] = useState(0);
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [alertsDisabled, setAlertsDisabled] = useState(false);

  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [loadError, setLoadError] = useState("");

  const selectedHousehold =
    households.find((household) => household.id === householdId) ?? null;

  const soonCount = alerts.filter(
    (alert) => alert.status === "TODAY" || alert.status === "SOON",
  ).length;

  const expiredCount = alerts.filter(
    (alert) => alert.status === "EXPIRED",
  ).length;

  const importantAlerts = alerts.slice(0, 5);

  useEffect(() => {
    let active = true;

    async function loadHouseholds() {
      try {
        setIsLoadingHouseholds(true);
        setLoadError("");

        const response = await fetch("/api/households", {
          credentials: "include",
        });

        const data = await response.json();

        if (!active) return;

        if (response.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.error ?? "Impossible de charger les foyers.",
          );
        }

        const availableHouseholds = data.households as Household[];

        setHouseholds(availableHouseholds);

        setHouseholdId((current) => {
          if (
            current !== null &&
            availableHouseholds.some(
              (household) => household.id === current,
            )
          ) {
            return current;
          }

          return availableHouseholds[0]?.id ?? null;
        });
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Impossible de charger les foyers.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingHouseholds(false);
        }
      }
    }

    void loadHouseholds();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (householdId === null) {
      return;
    }

    let active = true;

    async function loadSummary() {
      try {
        setIsLoadingSummary(true);
        setLoadError("");
        setTotalItems(0);
        setAlerts([]);
        setAlertsDisabled(false);

        const [inventoryResponse, alertsResponse] = await Promise.all([
          fetch(`/api/inventory?householdId=${householdId}`, {
            credentials: "include",
          }),
          fetch(`/api/alerts?householdId=${householdId}`, {
            credentials: "include",
          }),
        ]);

        const [inventoryData, alertsData] = await Promise.all([
          inventoryResponse.json(),
          alertsResponse.json(),
        ]);

        if (!active) return;

        if (
          inventoryResponse.status === 401 ||
          alertsResponse.status === 401
        ) {
          navigate("/", { replace: true });
          return;
        }

        if (!inventoryResponse.ok) {
          throw new Error(
            inventoryData.error ?? "Impossible de charger l'inventaire.",
          );
        }

        if (!alertsResponse.ok) {
          throw new Error(
            alertsData.error ?? "Impossible de charger les alertes.",
          );
        }

        const items = inventoryData.items as FoodItem[];
        const alertPayload = alertsData as AlertsResponse;

        setTotalItems(items.length);
        setAlerts(
          [...alertPayload.alerts].sort(
            (a, b) => a.daysRemaining - b.daysRemaining,
          ),
        );
        setAlertsDisabled(
          alertPayload.disabledByPreference === true,
        );
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Impossible de charger le tableau de bord.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingSummary(false);
        }
      }
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, [householdId, navigate]);

  if (isLoadingHouseholds) {
    return (
      <main className="page-shell">
        <section className="content-page">
          <p>Chargement de votre tableau de bord...</p>
        </section>
      </main>
    );
  }

  if (households.length === 0) {
    return (
      <main className="page-shell">
        <section className="content-page">
          <p className="eyebrow">Tableau de bord</p>
          <h1>Créez d'abord votre foyer.</h1>
          <p>
            Le tableau de bord MealSaver utilise les données de votre
            inventaire partagé.
          </p>

          <Link className="btn btn-primary" to="/household">
            Créer mon foyer
          </Link>
        </section>
      </main>
    );
  }

  const inventoryUrl =
    householdId === null
      ? "/inventory"
      : `/inventory?householdId=${householdId}`;

  const recipesUrl =
    householdId === null
      ? "/recipes"
      : `/recipes?householdId=${householdId}`;

  return (
    <main className="page-shell">
      <section className="content-page">
        <p className="eyebrow">Tableau de bord</p>
        <h1>Résumé de votre foyer.</h1>
        <p>
          Consultez rapidement votre inventaire, les aliments à consommer
          bientôt et les actions principales de MealSaver.
        </p>

        {households.length > 1 && (
          <section className="panel form-panel">
            <div className="panel-head">
              <div>
                <h2>Foyer actif</h2>
                <p>Sélectionnez le foyer à résumer.</p>
              </div>
            </div>

            <label htmlFor="dashboard-household">
              Foyer
              <select
                id="dashboard-household"
                value={householdId ?? ""}
                onChange={(event) =>
                  setHouseholdId(Number(event.target.value))
                }
              >
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
        )}

        <div className="app-stats">
          <article>
            <strong>{isLoadingSummary ? "…" : totalItems}</strong>
            <span>Aliments au total</span>
          </article>

          <article>
            <strong>
              {isLoadingSummary || alertsDisabled ? "…" : soonCount}
            </strong>
            <span>À consommer bientôt</span>
          </article>

          <article>
            <strong>
              {isLoadingSummary || alertsDisabled ? "…" : alerts.length}
            </strong>
            <span>
              {alertsDisabled
                ? "Alertes désactivées"
                : "Alertes importantes"}
            </span>
          </article>

          <article>
            <strong>
              {isLoadingSummary || alertsDisabled ? "…" : expiredCount}
            </strong>
            <span>Aliments expirés</span>
          </article>
        </div>

        {loadError && (
          <p className="form-message form-error" role="alert">
            {loadError}
          </p>
        )}

        <div className="app-grid two">
          <section className="panel dashboard-alerts">
            <div className="panel-head">
              <div>
                <p className="kicker">Priorités</p>
                <h2>Alertes importantes</h2>
                <p>{selectedHousehold?.name}</p>
              </div>

              {!alertsDisabled && (
                <span
                  className={`status ${
                    importantAlerts.length > 0 ? "urgent" : "ok"
                  }`}
                >
                  {importantAlerts.length} alerte
                  {importantAlerts.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {isLoadingSummary ? (
              <p>Chargement des alertes...</p>
            ) : alertsDisabled ? (
              <p>
                Les alertes d'expiration sont désactivées dans vos
                préférences.
              </p>
            ) : importantAlerts.length === 0 ? (
              <p>Aucune alerte importante pour ce foyer.</p>
            ) : (
              <div className="alert-feed">
                {importantAlerts.map((alert) => (
                  <article
                    className="alert-row"
                    key={alert.foodItemId}
                  >
                    <div>
                      <strong>{alert.name}</strong>
                      <small>{alert.message}</small>
                    </div>

                    <div>
                      <span className="status urgent">
                        {formatAlertStatus(alert)}
                      </span>

                      <Link
                        className="btn btn-soft"
                        to={`/inventory?householdId=${householdId}&item=${alert.foodItemId}`}
                      >
                        Voir l'aliment
                      </Link>

                      {alert.status !== "EXPIRED" && (
                        <Link
                          className="btn btn-soft"
                          to={`/recipes?householdId=${householdId}&ingredient=${encodeURIComponent(alert.name)}`}
                        >
                          Voir une recette
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="kicker">Actions rapides</p>
                <h2>Que souhaitez-vous faire ?</h2>
              </div>
            </div>

            <div className="app-stats dashboard-quick-actions">
              <article>
                <h3>Inventaire</h3>
                <p>Consulter et gérer les aliments du foyer.</p>
                <Link className="btn btn-primary" to={inventoryUrl}>
                  Ouvrir
                </Link>
              </article>

              <article>
                <h3>Scanner un aliment</h3>
                <p>Accéder à l'ajout rapide d'aliments.</p>
                <Link className="btn btn-soft" to="/scan">
                  Ouvrir
                </Link>
              </article>

              <article>
                <h3>Recettes</h3>
                <p>Trouver des idées avec vos aliments.</p>
                <Link className="btn btn-soft" to={recipesUrl}>
                  Ouvrir
                </Link>
              </article>

              <article>
                <h3>Liste</h3>
                <p>Consulter votre liste de courses.</p>
                <Link className="btn btn-soft" to="/shopping-list">
                  Ouvrir
                </Link>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
