import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { AddFoodForm } from "../AddFoodForm";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type IdentificationResult = {
  suggestion: string;
  requiresManualValidation: boolean;
};

type Household = {
  id: number;
  name: string;
  role: "OWNER" | "MEMBER";
};

export function ScanPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [identification, setIdentification] =
    useState<IdentificationResult | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [householdError, setHouseholdError] = useState("");
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadHouseholds() {
      try {
        const response = await fetch("/api/households", {
          credentials: "include",
        });

        const body = await response.json().catch(() => null);

        if (!active) return;

        if (!response.ok) {
          setHouseholdError(
            body?.error ?? "Impossible de charger les foyers.",
          );
          return;
        }

        const availableHouseholds = Array.isArray(body?.households)
          ? (body.households as Household[])
          : [];

        setHouseholds(availableHouseholds);
        setHouseholdId(availableHouseholds[0]?.id ?? null);
      } catch {
        if (active) {
          setHouseholdError(
            "Impossible de communiquer avec le serveur MealSaver.",
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
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setIdentification(null);

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Veuillez sélectionner une image JPEG, PNG ou WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      event.target.value = "";
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });

    setSelectedFile(file);
    setSelectedFileName(file.name || "Photo prise avec la caméra");
  }

  async function identifyFood() {
    if (!selectedFile || isIdentifying) {
      return;
    }

    setError("");
    setIdentification(null);
    setIsIdentifying(true);

    try {
      const response = await fetch("/api/scan/identify", {
        method: "POST",
        headers: {
          "Content-Type": selectedFile.type,
        },
        credentials: "include",
        body: selectedFile,
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          body?.error ??
            "Impossible d'obtenir une proposition d'identification.",
        );
        return;
      }

      if (
        typeof body?.suggestion !== "string" ||
        typeof body?.requiresManualValidation !== "boolean"
      ) {
        setError("Réponse d'identification invalide.");
        return;
      }

      setIdentification({
        suggestion: body.suggestion,
        requiresManualValidation: body.requiresManualValidation,
      });
    } catch {
      setError("Impossible de communiquer avec le service d'identification.");
    } finally {
      setIsIdentifying(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="content-page">
        <p className="eyebrow">Scan</p>
        <h1>Identifiez un aliment à partir d'une photo.</h1>
        <p>
          Téléversez une image ou prenez une photo de l'aliment pour obtenir
          une proposition d'identification.
        </p>

        <div className="app-grid two scan-layout">
          <section className="panel scan-panel">
            <div className="panel-head">
              <div>
                <h2>Photo de l'aliment</h2>
                <p>Formats acceptés : JPEG, PNG et WebP. Maximum 5 Mo.</p>
              </div>
            </div>

            <div className={previewUrl ? "scan-photo has-image" : "scan-photo"}>
              {previewUrl ? (
                <div className="scan-photo-content">
                  <img src={previewUrl} alt="Aperçu de l'aliment sélectionné" />
                  <span aria-hidden="true" />
                </div>
              ) : (
                <div>
                  <strong>Aucune image sélectionnée</strong>
                  <p>Choisissez une image ou prenez une photo.</p>
                </div>
              )}
            </div>

            <div className="scan-buttons">
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelection}
                hidden
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => uploadInputRef.current?.click()}
              >
                Téléverser une image
              </button>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleImageSelection}
                hidden
              />

              <button
                type="button"
                className="btn btn-soft"
                onClick={() => cameraInputRef.current?.click()}
              >
                Prendre une photo
              </button>
            </div>

            {selectedFileName && <p>Image : {selectedFileName}</p>}
            {error && <p role="alert">{error}</p>}
          </section>

          <aside className="panel result-panel scan-result-panel">
            <div className="panel-head">
              <div>
                <h2>Identification proposée</h2>
              </div>
            </div>

            {identification ? (
              <>
                <p>
                  Aliment proposé : <strong>{identification.suggestion}</strong>
                </p>

                <p role="status">
                  Cette identification est une proposition. Une validation
                  manuelle est obligatoire avant tout ajout à l'inventaire.
                </p>

                <hr />

                <h3>Valider ou corriger le résultat</h3>
                <p>
                  Vérifiez le nom proposé et renseignez la quantité avant de
                  confirmer l'ajout.
                </p>

                {isLoadingHouseholds ? (
                  <p>Chargement de vos foyers...</p>
                ) : householdError ? (
                  <p role="alert">{householdError}</p>
                ) : households.length === 0 ? (
                  <p role="alert">
                    Vous devez appartenir à un foyer avant d'ajouter cet
                    aliment à l'inventaire.
                  </p>
                ) : (
                  <>
                    {households.length > 1 && (
                      <div>
                        <label htmlFor="scan-household">Foyer</label>
                        <select
                          id="scan-household"
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
                      </div>
                    )}

                    {householdId !== null && (
                      <AddFoodForm
                        key={`${identification.suggestion}-${householdId}`}
                        householdId={householdId}
                        initialName={identification.suggestion}
                        submitLabel="Valider et ajouter à l'inventaire"
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <p>
                Sélectionnez une image puis demandez une proposition
                d'identification.
              </p>
            )}

            <button
              type="button"
              className="btn btn-primary full"
              onClick={() => void identifyFood()}
              disabled={!selectedFile || isIdentifying}
            >
              {isIdentifying
                ? "Identification en cours..."
                : "Identifier l'aliment"}
            </button>

            <p>
              Aucune identification ne crée automatiquement un aliment dans
              l'inventaire.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
