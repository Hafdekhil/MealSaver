import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth-context";

type PreferencesResponse = {
  preferences: {
    preferredIngredients: string[];
    expirationAlertsEnabled: boolean;
  };
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preferredIngredients, setPreferredIngredients] = useState("");
  const [expirationAlertsEnabled, setExpirationAlertsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDietary, setIsSavingDietary] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/preferences", {
          credentials: "include",
        });
        const data = (await response.json()) as PreferencesResponse & {
          error?: string;
        };

        if (response.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Impossible de charger le profil.");
        }

        if (active) {
          setPreferredIngredients(
            data.preferences.preferredIngredients.join(", "),
          );
          setExpirationAlertsEnabled(
            data.preferences.expirationAlertsEnabled,
          );
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger le profil.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadPreferences();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function saveDietaryPreferences() {
    if (isSavingDietary) return;

    try {
      setIsSavingDietary(true);
      setError("");
      setMessage("");

      const values = preferredIngredients
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const response = await fetch("/api/preferences/dietary", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredIngredients: values }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Impossible de sauvegarder les préférences.");
      }

      setPreferredIngredients(
        (data.preferredIngredients as string[]).join(", "),
      );
      setMessage("Préférences alimentaires sauvegardées.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de sauvegarder les préférences.",
      );
    } finally {
      setIsSavingDietary(false);
    }
  }

  async function saveNotificationPreferences() {
    if (isSavingNotifications) return;

    try {
      setIsSavingNotifications(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/preferences/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expirationAlertsEnabled }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Impossible de sauvegarder les notifications.");
      }

      setExpirationAlertsEnabled(Boolean(data.expirationAlertsEnabled));
      setMessage("Préférences de notification sauvegardées.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de sauvegarder les notifications.",
      );
    } finally {
      setIsSavingNotifications(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="content-page">
        <p className="eyebrow">Profil</p>
        <h1>Votre profil MealSaver</h1>

        {isLoading && <p>Chargement du profil...</p>}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        {!isLoading && user && (
          <>
            <section className="panel">
              <h2>Informations personnelles</h2>
              <p>
                <strong>Nom :</strong> {user.name}
              </p>
              <p>
                <strong>Courriel :</strong> {user.email}
              </p>
            </section>

            <section className="panel" id="preferences-alimentaires">
              <h2>Préférences alimentaires</h2>
              <p>
                Indiquez des ingrédients que vous appréciez. MealSaver peut les
                utiliser pour départager des recettes lorsque cela est possible,
                sans remplacer la priorité anti-gaspillage.
              </p>

              <label htmlFor="preferred-ingredients">
                Ingrédients préférés (séparés par des virgules)
              </label>
              <input
                id="preferred-ingredients"
                value={preferredIngredients}
                onChange={(event) => setPreferredIngredients(event.target.value)}
                placeholder="ex. tomates, fromage, riz"
                maxLength={500}
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void saveDietaryPreferences()}
                disabled={isSavingDietary}
              >
                {isSavingDietary
                  ? "Sauvegarde..."
                  : "Sauvegarder les préférences"}
              </button>
            </section>

            <section className="panel" id="notifications">
              <h2>Notifications</h2>
              <p>
                Contrôlez les alertes d'expiration affichées dans MealSaver.
              </p>

              <label>
                <input
                  type="checkbox"
                  checked={expirationAlertsEnabled}
                  onChange={(event) =>
                    setExpirationAlertsEnabled(event.target.checked)
                  }
                />{" "}
                Activer les alertes d'expiration
              </label>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void saveNotificationPreferences()}
                  disabled={isSavingNotifications}
                >
                  {isSavingNotifications
                    ? "Sauvegarde..."
                    : "Sauvegarder les notifications"}
                </button>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
