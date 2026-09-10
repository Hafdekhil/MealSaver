import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  produceSmartFridgeMeasurement,
  type SmartFridgeMeasurementPayload,
} from "../lib/smart-fridge-simulator";

type Household = {
  id: number;
  name: string;
  role: "OWNER" | "MEMBER";
};

type StoredMeasurement = SmartFridgeMeasurementPayload & {
  id: number;
  receivedAt: string;
};

type MeasurementResponse = {
  measurement: StoredMeasurement | null;
  error?: string;
  message?: string;
  code?: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function SmartFridgePage() {
  const navigate = useNavigate();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [latest, setLatest] = useState<StoredMeasurement | null>(null);
  const [lastPayload, setLastPayload] =
    useState<SmartFridgeMeasurementPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const loadLatest = useCallback(
    async (targetHouseholdId: number) => {
      const response = await fetch(
        `/api/smart-fridge/measurements/latest?householdId=${targetHouseholdId}`,
        {
          credentials: "include",
        },
      );

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      const data = (await response.json()) as MeasurementResponse;

      if (!response.ok) {
        throw new Error(
          data.error ?? "Impossible de charger la dernière mesure.",
        );
      }

      setLatest(data.measurement);
    },
    [navigate],
  );

  useEffect(() => {
    let active = true;

    async function loadHouseholds() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/households", {
          credentials: "include",
        });

        if (response.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Impossible de charger les foyers.");
        }

        const availableHouseholds = data.households as Household[];

        if (!active) return;

        setHouseholds(availableHouseholds);

        const firstHouseholdId = availableHouseholds[0]?.id ?? null;
        setHouseholdId(firstHouseholdId);

        if (firstHouseholdId !== null) {
          await loadLatest(firstHouseholdId);
        } else {
          setLatest(null);
        }
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Impossible de charger le simulateur.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadHouseholds();

    return () => {
      active = false;
    };
  }, [loadLatest, navigate]);

  async function handleHouseholdChange(nextHouseholdId: number) {
    setHouseholdId(nextHouseholdId);
    setLastPayload(null);
    setStatusMessage("");
    setError("");

    try {
      await loadLatest(nextHouseholdId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de charger la dernière mesure.",
      );
    }
  }

  async function transmit(mode: "normal" | "aberrant") {
    if (householdId === null || isTransmitting) return;

    const payload = produceSmartFridgeMeasurement(householdId, mode);

    setLastPayload(payload);
    setError("");
    setStatusMessage("");
    setIsTransmitting(true);

    try {
      const response = await fetch("/api/smart-fridge/measurements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      const data = (await response.json()) as MeasurementResponse;

      if (!response.ok) {
        if (response.status === 422 && data.code === "OUT_OF_SENSOR_RANGE") {
          setStatusMessage(
            data.message ??
              "La mesure aberrante a été reçue et rejetée sans être persistée.",
          );
          return;
        }

        throw new Error(data.error ?? "Transmission de la mesure impossible.");
      }

      if (data.measurement) {
        setLatest(data.measurement);
        setStatusMessage(
          "Mesure transmise, validée, persistée et restituée avec succès.",
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Transmission de la mesure impossible.",
      );
    } finally {
      setIsTransmitting(false);
    }
  }

  const selectedHousehold = households.find(
    (household) => household.id === householdId,
  );

  return (
    <main className="page-shell">
      <section className="content-page smart-fridge-page">
        <p className="eyebrow">Objet intelligent simulé</p>
        <h1>Température du réfrigérateur</h1>
        <p>
          Cette page démontre le parcours complet demandé au Sprint 2 :
          acquisition automatique par un simulateur, transmission à l'API,
          persistance et restitution dans l'interface.
        </p>

        {isLoading ? (
          <div className="panel">
            <p>Chargement du simulateur...</p>
          </div>
        ) : error && households.length === 0 ? (
          <div className="panel">
            <p role="alert">{error}</p>
          </div>
        ) : households.length === 0 ? (
          <div className="panel">
            <h2>Aucun foyer disponible</h2>
            <p>Créez d'abord un foyer pour rattacher les mesures à une source.</p>
          </div>
        ) : (
          <>
            <div className="panel smart-fridge-controls">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Acquisition + transmission</p>
                  <h2>Simulateur de capteur</h2>
                </div>
                <span className="status ok">sim-fridge-01</span>
              </div>

              <label htmlFor="smart-fridge-household">Foyer</label>
              <select
                id="smart-fridge-household"
                value={householdId ?? ""}
                onChange={(event) =>
                  void handleHouseholdChange(Number(event.target.value))
                }
              >
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.name}
                  </option>
                ))}
              </select>

              <p>
                Le bouton démarre le simulateur. La valeur n'est jamais saisie
                manuellement : le capteur logiciel la produit puis transmet le
                message JSON à l'API.
              </p>

              <div className="smart-fridge-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isTransmitting}
                  onClick={() => void transmit("normal")}
                >
                  {isTransmitting
                    ? "Transmission..."
                    : "Produire et transmettre une mesure"}
                </button>

                <button
                  type="button"
                  className="btn btn-soft"
                  disabled={isTransmitting}
                  onClick={() => void transmit("aberrant")}
                >
                  Provoquer une valeur aberrante
                </button>
              </div>

              {lastPayload && (
                <div className="smart-fridge-payload">
                  <strong>Message transmis à l'API</strong>
                  <pre>{JSON.stringify(lastPayload, null, 2)}</pre>
                </div>
              )}

              {statusMessage && <p role="status">{statusMessage}</p>}
              {error && <p role="alert">{error}</p>}
            </div>

            <div className="smart-fridge-flow" aria-label="Parcours de la mesure">
              <article className="panel">
                <span className="smart-fridge-step">1</span>
                <h3>Acquisition</h3>
                <p>Le simulateur produit automatiquement la température.</p>
              </article>

              <article className="panel">
                <span className="smart-fridge-step">2</span>
                <h3>Transmission</h3>
                <p>Le message JSON est envoyé à l'API protégée MealSaver.</p>
              </article>

              <article className="panel">
                <span className="smart-fridge-step">3</span>
                <h3>Persistance</h3>
                <p>
                  Le backend valide la trame puis enregistre valeur, source et
                  horodatage dans PostgreSQL.
                </p>
              </article>

              <article className="panel">
                <span className="smart-fridge-step">4</span>
                <h3>Restitution</h3>
                <p>La dernière mesure persistée est relue et affichée ici.</p>
              </article>
            </div>

            <div className="panel smart-fridge-latest">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Restitution</p>
                  <h2>Dernière mesure persistée</h2>
                </div>
                <button
                  type="button"
                  className="btn btn-soft"
                  disabled={householdId === null}
                  onClick={() => {
                    if (householdId !== null) {
                      void loadLatest(householdId).catch((caught) => {
                        setError(
                          caught instanceof Error
                            ? caught.message
                            : "Actualisation impossible.",
                        );
                      });
                    }
                  }}
                >
                  Actualiser
                </button>
              </div>

              {latest ? (
                <div className="smart-fridge-reading">
                  <strong>{latest.value.toFixed(1)} °C</strong>
                  <span>Foyer : {selectedHousehold?.name}</span>
                  <span>Source : {latest.sourceId}</span>
                  <span>Mesurée : {formatDateTime(latest.measuredAt)}</span>
                  <span>Reçue : {formatDateTime(latest.receivedAt)}</span>
                </div>
              ) : (
                <p>
                  Aucune mesure disponible. Lancez le simulateur pour produire
                  la première mesure.
                </p>
              )}
            </div>

            <div className="panel smart-fridge-failure">
              <p className="eyebrow">Scénario de défaillance</p>
              <h2>Valeur aberrante</h2>
              <p>
                Le mode de défaillance produit automatiquement 999 °C. L'API
                reçoit la trame, la reconnaît comme hors du contrat technique du
                capteur simulé, la rejette avec un statut explicite et ne
                l'enregistre pas. Il ne s'agit pas d'un seuil de sécurité
                alimentaire.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
