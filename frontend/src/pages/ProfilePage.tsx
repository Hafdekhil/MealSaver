import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth-context";
import "../profile-page.css";

type PreferencesResponse = {
  preferences: {
    preferredIngredients: string[];
    expirationAlertsEnabled: boolean;
  };
};

type DietaryPreference =
  | "none"
  | "vegetarian"
  | "vegan"
  | "mediterranean";

const dietaryOptions: Array<{
  value: DietaryPreference;
  title: string;
  description: string;
}> = [
  {
    value: "none",
    title: "Aucune préférence particulière",
    description: "MealSaver privilégie simplement les aliments à utiliser en priorité.",
  },
  {
    value: "vegetarian",
    title: "Végétarien",
    description: "Préférer des recettes sans viande ni poisson.",
  },
  {
    value: "vegan",
    title: "Végétalien",
    description: "Préférer des recettes sans produits d'origine animale.",
  },
  {
    value: "mediterranean",
    title: "Méditerranéen",
    description: "Préférer des recettes inspirées de l'alimentation méditerranéenne.",
  },
];

function getStoredDietaryPreference(values: string[]): DietaryPreference {
  const value = values[0]?.trim().toLowerCase();

  if (
    value === "vegetarian" ||
    value === "vegan" ||
    value === "mediterranean"
  ) {
    return value;
  }

  return "none";
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dietaryPreference, setDietaryPreference] =
    useState<DietaryPreference>("none");
  const [savedDietaryPreference, setSavedDietaryPreference] =
    useState<DietaryPreference>("none");

  const [expirationAlertsEnabled, setExpirationAlertsEnabled] =
    useState(true);
  const [savedExpirationAlertsEnabled, setSavedExpirationAlertsEnabled] =
    useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDietary, setIsSavingDietary] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [error, setError] = useState("");
  const [dietaryMessage, setDietaryMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

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
          throw new Error(
            data.error ?? "Impossible de charger le profil.",
          );
        }

        if (!active) return;

        const storedPreference = getStoredDietaryPreference(
          data.preferences.preferredIngredients,
        );

        setDietaryPreference(storedPreference);
        setSavedDietaryPreference(storedPreference);

        setExpirationAlertsEnabled(
          data.preferences.expirationAlertsEnabled,
        );
        setSavedExpirationAlertsEnabled(
          data.preferences.expirationAlertsEnabled,
        );
      } catch (caughtError) {
        if (!active) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger le profil.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
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
      setDietaryMessage("");

      const preferredIngredients =
        dietaryPreference === "none" ? [] : [dietaryPreference];

      const response = await fetch("/api/preferences/dietary", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferredIngredients }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Impossible de sauvegarder les préférences alimentaires.",
        );
      }

      const storedPreference = getStoredDietaryPreference(
        data.preferredIngredients as string[],
      );

      setDietaryPreference(storedPreference);
      setSavedDietaryPreference(storedPreference);
      setDietaryMessage("Préférence alimentaire sauvegardée.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de sauvegarder les préférences alimentaires.",
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
      setNotificationMessage("");

      const response = await fetch("/api/preferences/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expirationAlertsEnabled }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Impossible de sauvegarder les notifications.",
        );
      }

      const savedValue = Boolean(data.expirationAlertsEnabled);

      setExpirationAlertsEnabled(savedValue);
      setSavedExpirationAlertsEnabled(savedValue);
      setNotificationMessage(
        savedValue
          ? "Alertes d'expiration activées."
          : "Alertes d'expiration désactivées.",
      );
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

  const dietaryHasChanges =
    dietaryPreference !== savedDietaryPreference;

  const notificationHasChanges =
    expirationAlertsEnabled !== savedExpirationAlertsEnabled;

  return (
    <main className="page-shell">
      <section className="profile-page">
        <header className="profile-page-header">
          <p className="eyebrow">Profil</p>
          <h1>Votre profil MealSaver</h1>
          <p>
            Consultez vos informations et personnalisez les préférences
            utilisées par MealSaver.
          </p>
        </header>

        {isLoading && <p>Chargement du profil...</p>}

        {error && (
          <p className="profile-error-message" role="alert">
            {error}
          </p>
        )}

        {!isLoading && user && (
          <div className="profile-grid">
            <section className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h2>Informations personnelles</h2>
                  <p>Informations associées à votre compte MealSaver.</p>
                </div>
                <div className="profile-icon" aria-hidden="true">
                  👤
                </div>
              </div>

              <div className="profile-info-list">
                <div className="profile-info-row">
                  <span>Nom</span>
                  <strong>{user.name}</strong>
                </div>

                <div className="profile-info-row">
                  <span>Courriel</span>
                  <strong>{user.email}</strong>
                </div>
              </div>
            </section>

            <section
              className="profile-card"
              id="preferences-alimentaires"
            >
              <div className="profile-card-header">
                <div>
                  <h2>Préférences alimentaires</h2>
                  <p>
                    Choisissez le type d'alimentation que MealSaver doit
                    privilégier lorsque plusieurs recettes conviennent.
                  </p>
                </div>
                <div className="profile-icon" aria-hidden="true">
                  🍽️
                </div>
              </div>

              <div
                className="dietary-options"
                role="radiogroup"
                aria-label="Préférence alimentaire"
              >
                {dietaryOptions.map((option) => (
                  <label
                    className="dietary-option"
                    key={option.value}
                  >
                    <input
                      type="radio"
                      name="dietary-preference"
                      value={option.value}
                      checked={dietaryPreference === option.value}
                      onChange={() => {
                        setDietaryPreference(option.value);
                        setDietaryMessage("");
                      }}
                    />

                    <span className="dietary-option-content">
                      <strong>{option.title}</strong>
                      <span>{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="profile-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void saveDietaryPreferences()}
                  disabled={isSavingDietary || !dietaryHasChanges}
                >
                  {isSavingDietary
                    ? "Sauvegarde..."
                    : dietaryHasChanges
                      ? "Sauvegarder la préférence"
                      : "Préférence enregistrée"}
                </button>

                {dietaryMessage && (
                  <p
                    className="profile-save-message"
                    role="status"
                  >
                    ✓ {dietaryMessage}
                  </p>
                )}
              </div>
            </section>

            <section
              className="profile-card profile-card-wide"
              id="notifications"
            >
              <div className="profile-card-header">
                <div>
                  <h2>Notifications</h2>
                  <p>
                    Choisissez si MealSaver doit afficher les alertes pour
                    les aliments proches de leur date d'expiration.
                  </p>
                </div>
                <div className="profile-icon" aria-hidden="true">
                  🔔
                </div>
              </div>

              <div className="notification-control">
                <div className="notification-control-copy">
                  <strong>Alertes d'expiration</strong>
                  <span>
                    Recevoir les alertes MealSaver concernant les aliments
                    à consommer prochainement.
                  </span>

                  <div
                    className={`notification-status ${
                      expirationAlertsEnabled
                        ? "enabled"
                        : "disabled"
                    }`}
                  >
                    {expirationAlertsEnabled
                      ? "Alertes activées"
                      : "Alertes désactivées"}
                  </div>
                </div>

                <label className="notification-switch">
                  <input
                    type="checkbox"
                    aria-label="Activer les alertes d'expiration"
                    checked={expirationAlertsEnabled}
                    onChange={(event) => {
                      setExpirationAlertsEnabled(
                        event.target.checked,
                      );
                      setNotificationMessage("");
                    }}
                  />
                  <span className="notification-switch-track" />
                </label>
              </div>

              <div className="profile-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    void saveNotificationPreferences()
                  }
                  disabled={
                    isSavingNotifications || !notificationHasChanges
                  }
                >
                  {isSavingNotifications
                    ? "Sauvegarde..."
                    : notificationHasChanges
                      ? "Sauvegarder les notifications"
                      : "Notifications enregistrées"}
                </button>

                {notificationMessage && (
                  <p
                    className="profile-save-message"
                    role="status"
                  >
                    ✓ {notificationMessage}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
