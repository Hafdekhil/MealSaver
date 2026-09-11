import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../shopping-list-page.css";

type Household = {
  id: number;
  name: string;
  role: "OWNER" | "MEMBER";
};

type ShoppingUser = {
  id: number;
  name: string;
};

type ShoppingItem = {
  id: number;
  householdId: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  purchased: boolean;
  createdByUser: ShoppingUser | null;
  purchasedByUser: ShoppingUser | null;
};

export function ShoppingListPage() {
  const navigate = useNavigate();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHouseholds() {
      try {
        const response = await fetch("/api/households", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.error ?? "Impossible de charger les foyers.",
          );
        }

        if (!active) return;

        const loadedHouseholds = data.households as Household[];

        setHouseholds(loadedHouseholds);
        setHouseholdId(loadedHouseholds[0]?.id ?? null);
      } catch (caughtError) {
        if (!active) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger les foyers.",
        );
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
  }, [navigate]);

  useEffect(() => {
    if (householdId === null) return;

    let active = true;

    async function loadItems() {
      try {
        setError("");

        const response = await fetch(
          `/api/shopping-list?householdId=${householdId}`,
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ?? "Impossible de charger la liste.",
          );
        }

        if (active) {
          setItems(data.items as ShoppingItem[]);
        }
      } catch (caughtError) {
        if (!active) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger la liste.",
        );
      }
    }

    void loadItems();

    return () => {
      active = false;
    };
  }, [householdId]);

  async function reloadItems(targetHouseholdId: number) {
    const response = await fetch(
      `/api/shopping-list?householdId=${targetHouseholdId}`,
      {
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ?? "Impossible de charger la liste.",
      );
    }

    setItems(data.items as ShoppingItem[]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      householdId === null ||
      !name.trim() ||
      isSaving
    ) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      const payload: {
        householdId: number;
        name: string;
        quantity?: number;
        unit?: string;
      } = {
        householdId,
        name: name.trim(),
      };

      if (quantity.trim()) {
        payload.quantity = Number(quantity);
      }

      if (unit.trim()) {
        payload.unit = unit.trim();
      }

      const response = await fetch("/api/shopping-list", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const fallbackError =
          response.status === 409
            ? "Cet article existe déjà avec une unité différente. Utilisez la même unité pour fusionner les quantités."
            : "Impossible d'ajouter l'article.";

        throw new Error(data.error ?? fallbackError);
      }

      setName("");
      setQuantity("");
      setUnit("");

      setMessage(
        data.merged
          ? "Article déjà présent : les quantités ont été fusionnées."
          : "Article ajouté à la liste du foyer.",
      );

      await reloadItems(householdId);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible d'ajouter l'article.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePurchased(item: ShoppingItem) {
    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/shopping-list/${item.id}/purchased`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            purchased: !item.purchased,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Impossible de modifier l'article.",
        );
      }

      if (householdId !== null) {
        await reloadItems(householdId);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de modifier l'article.",
      );
    }
  }

  const pendingItems = items.filter(
    (item) => !item.purchased,
  );

  const purchasedItems = items.filter(
    (item) => item.purchased,
  );

  function renderItem(item: ShoppingItem) {
    const quantityText =
      item.quantity !== null
        ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
        : item.unit ?? "";

    return (
      <li
        key={item.id}
        className={`shopping-item ${
          item.purchased ? "purchased" : ""
        }`}
      >
        <label className="shopping-item-main">
          <input
            className="shopping-checkbox"
            type="checkbox"
            checked={item.purchased}
            onChange={() => void togglePurchased(item)}
            aria-label={
              item.purchased
                ? `Marquer ${item.name} comme à acheter`
                : `Marquer ${item.name} comme acheté`
            }
          />

          <span className="shopping-item-copy">
            <strong>{item.name}</strong>

            {(quantityText || item.createdByUser) && (
              <span>
                {quantityText}

                {quantityText && item.createdByUser
                  ? " · "
                  : ""}

                {item.createdByUser
                  ? `Ajouté par ${item.createdByUser.name}`
                  : ""}
              </span>
            )}
          </span>
        </label>

        <span className="shopping-item-status">
          {item.purchased
            ? item.purchasedByUser
              ? `Acheté par ${item.purchasedByUser.name}`
              : "Acheté"
            : "À acheter"}
        </span>
      </li>
    );
  }

  return (
    <main className="page-shell">
      <section className="shopping-page">
        <header className="shopping-page-header">
          <p className="eyebrow">Liste d'épicerie</p>

          <h1>Les achats du foyer au même endroit.</h1>

          <p>
            Ajoutez des articles manuellement ou envoyez les
            ingrédients manquants depuis une recette. Tous les
            membres du foyer partagent ensuite la même liste.
          </p>
        </header>

        {isLoading && <p>Chargement...</p>}

        {error && (
          <p
            className="shopping-feedback error"
            role="alert"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            className="shopping-feedback success"
            role="status"
          >
            ✓ {message}
          </p>
        )}

        {!isLoading && households.length === 0 && (
          <div className="page-placeholder">
            <h2>Aucun foyer</h2>
            <p>
              Créez ou rejoignez un foyer avant de préparer
              une liste d'épicerie.
            </p>
          </div>
        )}

        {households.length > 0 &&
          householdId !== null && (
            <>
              {households.length > 1 && (
                <section className="shopping-card shopping-household-card">
                  <label htmlFor="shopping-household">
                    Foyer utilisé
                  </label>

                  <select
                    id="shopping-household"
                    className="shopping-household-select"
                    value={householdId}
                    onChange={(event) =>
                      setHouseholdId(
                        Number(event.target.value),
                      )
                    }
                  >
                    {households.map((household) => (
                      <option
                        key={household.id}
                        value={household.id}
                      >
                        {household.name}
                      </option>
                    ))}
                  </select>
                </section>
              )}

              <div className="shopping-source-grid">
                <section className="shopping-card">
                  <div className="shopping-card-header">
                    <div
                      className="shopping-card-icon"
                      aria-hidden="true"
                    >
                      ✍️
                    </div>

                    <div>
                      <h2>Ajouter manuellement</h2>
                      <p>
                        Ajoutez directement un produit dont le
                        foyer a besoin.
                      </p>
                    </div>
                  </div>

                  <form
                    className="shopping-form"
                    onSubmit={handleSubmit}
                  >
                    <div className="shopping-field">
                      <label htmlFor="shopping-name">
                        Article
                      </label>

                      <input
                        id="shopping-name"
                        value={name}
                        onChange={(event) =>
                          setName(event.target.value)
                        }
                        placeholder="Ex. lait"
                        maxLength={120}
                        required
                      />
                    </div>

                    <div className="shopping-field">
                      <label htmlFor="shopping-quantity">
                        Quantité
                      </label>

                      <input
                        id="shopping-quantity"
                        type="number"
                        min="0.01"
                        step="any"
                        value={quantity}
                        onChange={(event) =>
                          setQuantity(event.target.value)
                        }
                        placeholder="Ex. 2"
                      />
                    </div>

                    <div className="shopping-field">
                      <label htmlFor="shopping-unit">
                        Unité
                      </label>

                      <input
                        id="shopping-unit"
                        value={unit}
                        onChange={(event) =>
                          setUnit(event.target.value)
                        }
                        placeholder="Ex. L, kg"
                        maxLength={40}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary shopping-add-button"
                      disabled={isSaving}
                    >
                      {isSaving
                        ? "Ajout..."
                        : "+ Ajouter à la liste"}
                    </button>
                  </form>
                </section>

                <section className="shopping-card shopping-recipe-card">
                  <div className="shopping-recipe-content">
                    <div className="shopping-card-header">
                      <div
                        className="shopping-card-icon"
                        aria-hidden="true"
                      >
                        🍲
                      </div>

                      <div>
                        <h2>Depuis une recette</h2>
                        <p>
                          Complétez automatiquement vos achats
                          avec les ingrédients qui vous manquent.
                        </p>
                      </div>
                    </div>

                    <p className="shopping-recipe-note">
                      Cette liste est la même que la liste
                      manuelle : les ingrédients ajoutés depuis
                      une recette arrivent directement ici.
                    </p>

                    <div className="shopping-recipe-flow">
                      <span>Choisissez une recette</span>
                      <span>
                        Vérifiez les ingrédients manquants
                      </span>
                      <span>
                        Ajoutez-les à la liste du foyer
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate("/recipes")}
                  >
                    Voir les recettes
                  </button>
                </section>
              </div>

              <section className="shopping-list-card">
                <div className="shopping-list-heading">
                  <div>
                    <h2>Liste du foyer</h2>
                    <p>
                      Une seule liste partagée pour tous les
                      membres.
                    </p>
                  </div>

                  <span className="shopping-count">
                    {pendingItems.length} à acheter
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="shopping-empty">
                    Votre liste est vide. Ajoutez un article
                    manuellement ou choisissez les ingrédients
                    manquants d'une recette.
                  </p>
                ) : (
                  <>
                    <div className="shopping-section">
                      <h3 className="shopping-section-title">
                        À acheter
                      </h3>

                      {pendingItems.length === 0 ? (
                        <p className="shopping-empty">
                          Tous les articles ont été achetés.
                        </p>
                      ) : (
                        <ul className="shopping-items">
                          {pendingItems.map(renderItem)}
                        </ul>
                      )}
                    </div>

                    {purchasedItems.length > 0 && (
                      <div className="shopping-section">
                        <h3 className="shopping-section-title">
                          Achetés
                        </h3>

                        <ul className="shopping-items">
                          {purchasedItems.map(renderItem)}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
      </section>
    </main>
  );
}
