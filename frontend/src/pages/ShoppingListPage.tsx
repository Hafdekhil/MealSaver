import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
          throw new Error(data.error ?? "Impossible de charger les foyers.");
        }

        if (active) {
          const loadedHouseholds = data.households as Household[];
          setHouseholds(loadedHouseholds);
          setHouseholdId(loadedHouseholds[0]?.id ?? null);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger les foyers.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadHouseholds();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (householdId === null) {
      setItems([]);
      return;
    }

    let active = true;

    async function loadItems() {
      try {
        setError("");
        const response = await fetch(
          `/api/shopping-list?householdId=${householdId}`,
          { credentials: "include" },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Impossible de charger la liste.");
        }

        if (active) setItems(data.items as ShoppingItem[]);
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger la liste.",
          );
        }
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
      { credentials: "include" },
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Impossible de charger la liste.");
    }

    setItems(data.items as ShoppingItem[]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (householdId === null || !name.trim() || isSaving) return;

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

      if (quantity.trim()) payload.quantity = Number(quantity);
      if (unit.trim()) payload.unit = unit.trim();

      const response = await fetch("/api/shopping-list", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Impossible d'ajouter l'article.");
      }

      setName("");
      setQuantity("");
      setUnit("");
      setMessage(
        data.merged
          ? "Article déjà présent : la liste a été fusionnée sans créer de doublon."
          : "Article ajouté à la liste collaborative.",
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchased: !item.purchased }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Impossible de modifier l'article.");
      }

      if (householdId !== null) await reloadItems(householdId);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de modifier l'article.",
      );
    }
  }

  return (
    <main className="page-shell">
      <section className="content-page">
        <p className="eyebrow">Liste d'épicerie</p>
        <h1>Préparez les achats du foyer ensemble.</h1>
        <p>
          Chaque membre du foyer voit la même liste et peut indiquer les achats
          déjà effectués.
        </p>

        {isLoading && <p>Chargement...</p>}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        {!isLoading && households.length === 0 && (
          <div className="page-placeholder">
            <h2>Aucun foyer</h2>
            <p>Créez ou rejoignez un foyer avant de préparer une liste.</p>
          </div>
        )}

        {households.length > 0 && householdId !== null && (
          <>
            {households.length > 1 && (
              <div className="panel">
                <label htmlFor="shopping-household">Foyer</label>
                <select
                  id="shopping-household"
                  value={householdId}
                  onChange={(event) => setHouseholdId(Number(event.target.value))}
                >
                  {households.map((household) => (
                    <option key={household.id} value={household.id}>
                      {household.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form className="panel" onSubmit={handleSubmit}>
              <h2>Ajouter un article</h2>

              <label htmlFor="shopping-name">Nom</label>
              <input
                id="shopping-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                required
              />

              <label htmlFor="shopping-quantity">Quantité (optionnelle)</label>
              <input
                id="shopping-quantity"
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />

              <label htmlFor="shopping-unit">Unité (optionnelle)</label>
              <input
                id="shopping-unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                maxLength={40}
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Ajout..." : "Ajouter à la liste"}
              </button>
            </form>

            <section className="panel">
              <h2>Liste collaborative</h2>

              {items.length === 0 ? (
                <p>Aucun article pour le moment.</p>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id} style={{ marginBottom: "1rem" }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.purchased}
                          onChange={() => void togglePurchased(item)}
                        />{" "}
                        <strong>{item.name}</strong>
                        {item.quantity !== null && ` — ${item.quantity}`}
                        {item.unit && ` ${item.unit}`}
                      </label>

                      <div>
                        {item.purchased ? (
                          <span>
                            Acheté
                            {item.purchasedByUser
                              ? ` par ${item.purchasedByUser.name}`
                              : ""}
                          </span>
                        ) : (
                          <span>À acheter</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
