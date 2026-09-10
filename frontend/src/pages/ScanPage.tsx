import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

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

export function ScanPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [identification, setIdentification] =
    useState<IdentificationResult | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
          body?.error ?? "Impossible d'obtenir une proposition d'identification.",
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

          <aside className="panel result-panel">
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
