import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddFoodForm } from "../AddFoodForm";

type Household = {
  id: number;
  name: string;
  createdAt: string;
  role: "OWNER" | "MEMBER";
};

type StorageLocation = "FRIDGE" | "PANTRY" | "FREEZER";

type FoodItem = {
  id: number;
  householdId: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  expiresAt: string | null;
  storageLocation: StorageLocation | null;
};

type EditDraft = {
  name: string;
  quantity: string;
  unit: string;
  expiresAt: string;
  storageLocation: StorageLocation;
};

const locationLabels: Record<StorageLocation, string> = {
  FRIDGE: "Frigo",
  PANTRY: "Garde-manger",
  FREEZER: "Congélateur",
};

function formatExpiration(value: string | null) {
  if (!value) return "Aucune expiration";

  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function InventoryPage() {
  const navigate = useNavigate();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);

  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedHousehold =
    households.find((household) => household.id === householdId) ?? null;

  async function loadItems(targetHouseholdId: number) {
    setIsLoadingItems(true);
    setLoadError("");

    try {
      const response = await fetch(
        `/api/inventory?householdId=${targetHouseholdId}`,
        { credentials: "include" },
      );

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Impossible de charger l'inventaire.");
      }

      setItems(data.items as FoodItem[]);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Impossible de charger l'inventaire.",
      );
    } finally {
      setIsLoadingItems(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadHouseholds() {
      try {
        const response = await fetch("/api/households", {
          credentials: "include",
        });

        if (!active) return;

        if (response.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Impossible de charger les foyers.");
        }

        const availableHouseholds = data.households as Household[];

        setHouseholds(availableHouseholds);

        if (availableHouseholds.length > 0) {
          setHouseholdId(availableHouseholds[0]?.id ?? null);
        }
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
    if (householdId !== null) {
      void loadItems(householdId);
    } else {
      setItems([]);
    }
  }, [householdId]);

  function startEdit(item: FoodItem) {
    setActionError("");
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      quantity: item.quantity === null ? "" : String(item.quantity),
      unit: item.unit ?? "",
      expiresAt: item.expiresAt ? item.expiresAt.slice(0, 10) : "",
      storageLocation: item.storageLocation ?? "FRIDGE",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setActionError("");
  }

  async function saveEdit(itemId: number) {
    if (!editDraft) return;

    const name = editDraft.name.trim();
    const parsedQuantity =
      editDraft.quantity.trim() === ""
        ? null
        : Number(editDraft.quantity);

    if (!name) {
      setActionError("Le nom de l'aliment est obligatoire.");
      return;
    }

    if (
      parsedQuantity !== null &&
      (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0)
    ) {
      setActionError("La quantité doit être supérieure à 0.");
      return;
    }

    setIsSaving(true);
    setActionError("");

    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          quantity: parsedQuantity,
          unit: editDraft.unit.trim() || null,
          expiresAt: editDraft.expiresAt || null,
          storageLocation: editDraft.storageLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Impossible de modifier l'aliment.");
      }

      setItems((current) =>
        current.map((item) =>
          item.id === itemId ? (data.item as FoodItem) : item,
        ),
      );

      cancelEdit();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Impossible de modifier l'aliment.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem(item: FoodItem) {
    const confirmed = window.confirm(
      `Supprimer "${item.name}" de l'inventaire partagé ?`,
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setActionError("");

    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Impossible de supprimer l'aliment.");
      }

      setItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id),
      );

      if (editingId === item.id) {
        cancelEdit();
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer l'aliment.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoadingHouseholds) {
    return (
      <main className="page-shell">
        <section className="content-page">
          <p>Chargement de votre inventaire...</p>
        </section>
      </main>
    );
  }

  if (households.length === 0) {
    return (
      <main className="page-shell">
        <section className="content-page">
          <p className="eyebrow">Inventaire</p>
          <h1>Créez d'abord votre foyer.</h1>
          <p>
            Un inventaire MealSaver appartient toujours à un foyer partagé.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/household")}
          >
            Aller au foyer
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="content-page">
        <p className="eyebrow">Inventaire partagé</p>
        <h1>Gérez les aliments de votre foyer.</h1>
        <p>
          Ajoutez, modifiez et supprimez les aliments disponibles dans le foyer.
        </p>

        {households.length > 1 && (
          <div className="panel form-panel">
            <label htmlFor="inventory-household">Foyer actif</label>
            <select
              id="inventory-household"
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

        {loadError && <p role="alert">{loadError}</p>}
        {actionError && <p role="alert">{actionError}</p>}

        <div className="app-grid two inventory-layout">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Inventaire du foyer</h2>
                <p>{selectedHousehold?.name}</p>
              </div>
              <span className="status ok">
                {items.length} aliment{items.length > 1 ? "s" : ""}
              </span>
            </div>

            {isLoadingItems ? (
              <p>Chargement des aliments...</p>
            ) : items.length === 0 ? (
              <div className="page-placeholder">
                <h3>Inventaire vide</h3>
                <p>
                  Ajoutez votre premier aliment avec le formulaire ci-contre.
                </p>
              </div>
            ) : (
              <div className="inventory-feed">
                {items.map((item) => (
                  <article className="food-row" key={item.id}>
                    {editingId === item.id && editDraft ? (
                      <div className="form-panel" style={{ width: "100%" }}>
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveEdit(item.id);
                          }}
                        >
                          <label htmlFor={`edit-name-${item.id}`}>
                            Aliment
                          </label>
                          <input
                            id={`edit-name-${item.id}`}
                            value={editDraft.name}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                name: event.target.value,
                              })
                            }
                            required
                          />

                          <label htmlFor={`edit-quantity-${item.id}`}>
                            Quantité
                          </label>
                          <input
                            id={`edit-quantity-${item.id}`}
                            type="number"
                            min="0.01"
                            step="any"
                            value={editDraft.quantity}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                quantity: event.target.value,
                              })
                            }
                          />

                          <label htmlFor={`edit-unit-${item.id}`}>Unité</label>
                          <input
                            id={`edit-unit-${item.id}`}
                            value={editDraft.unit}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                unit: event.target.value,
                              })
                            }
                          />

                          <label htmlFor={`edit-location-${item.id}`}>
                            Emplacement
                          </label>
                          <select
                            id={`edit-location-${item.id}`}
                            value={editDraft.storageLocation}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                storageLocation:
                                  event.target.value as StorageLocation,
                              })
                            }
                          >
                            <option value="FRIDGE">Frigo</option>
                            <option value="PANTRY">Garde-manger</option>
                            <option value="FREEZER">Congélateur</option>
                          </select>

                          <label htmlFor={`edit-expiration-${item.id}`}>
                            Date d'expiration
                          </label>
                          <input
                            id={`edit-expiration-${item.id}`}
                            type="date"
                            value={editDraft.expiresAt}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                expiresAt: event.target.value,
                              })
                            }
                          />

                          <div>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={isSaving}
                            >
                              {isSaving ? "Enregistrement..." : "Enregistrer"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-soft"
                              onClick={cancelEdit}
                              disabled={isSaving}
                            >
                              Annuler
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="food-left">
                          <div>
                            <strong>{item.name}</strong>
                            <small>
                              {item.quantity ?? "—"} {item.unit ?? ""}
                              {" · "}
                              {item.storageLocation
                                ? locationLabels[item.storageLocation]
                                : "Emplacement non défini"}
                              {" · "}
                              {formatExpiration(item.expiresAt)}
                            </small>
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            className="btn btn-soft"
                            onClick={() => startEdit(item)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="btn btn-soft"
                            onClick={() => void deleteItem(item)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id
                              ? "Suppression..."
                              : "Supprimer"}
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="panel form-panel">
            <div className="panel-head">
              <div>
                <h2>Ajouter un aliment</h2>
                <p>{selectedHousehold?.name}</p>
              </div>
            </div>

            {householdId !== null && (
              <AddFoodForm
                householdId={householdId}
                onCreated={() => void loadItems(householdId)}
              />
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}