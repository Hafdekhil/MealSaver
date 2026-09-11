import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Household = {
  id: number;
  name: string;
  createdAt: string;
  role: "OWNER" | "MEMBER";
};

type PriorityIngredient = {
  name: string;
  expiresAt: string | null;
  daysUntilExpiration: number | null;
};

type RecipeSuggestion = {
  id: string;
  name: string;
  ingredients: string[];
  inventoryIngredients: string[];
  availableIngredients: string[];
  missingIngredients: string[];
  priorityIngredient: PriorityIngredient;
  recommendationReason: string;
  preferenceApplied?: boolean;
  isFallback: boolean;
};

function getPositiveIntegerParam(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedHouseholdId = getPositiveIntegerParam(
    searchParams.get("householdId"),
  );
  const requestedIngredient = searchParams.get("ingredient")?.trim() ?? "";

  const [household, setHousehold] = useState<Household | null>(null);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [selectedMissingIngredients, setSelectedMissingIngredients] = useState<
    Record<string, string[]>
  >({});
  const [selectionMessages, setSelectionMessages] = useState<
    Record<string, string>
  >({});
  const [addingRecipeId, setAddingRecipeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecipes() {
      try {
        setIsLoading(true);
        setError("");
        setSelectionMessages({});

        const householdsResponse = await fetch("/api/households", {
          credentials: "include",
        });

        if (householdsResponse.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        const householdsData = await householdsResponse.json();

        if (!householdsResponse.ok) {
          throw new Error(
            householdsData.error ?? "Impossible de charger les foyers.",
          );
        }

        const households = householdsData.households as Household[];

        if (households.length === 0) {
          if (active) {
            setHousehold(null);
            setSuggestions([]);
          }

          return;
        }

        const selectedHousehold =
          (requestedHouseholdId !== null
            ? households.find(
                (candidate) => candidate.id === requestedHouseholdId,
              )
            : undefined) ?? households[0]!;

        if (active) {
          setHousehold(selectedHousehold);
        }

        const recipeParams = new URLSearchParams({
          householdId: String(selectedHousehold.id),
        });

        if (requestedIngredient) {
          recipeParams.set("ingredient", requestedIngredient);
        }

        const recipesResponse = await fetch(
          `/api/recipes?${recipeParams.toString()}`,
          {
            credentials: "include",
          },
        );

        const recipesData = await recipesResponse.json();

        if (!recipesResponse.ok) {
          throw new Error(
            recipesData.error ?? "Impossible de charger les recettes.",
          );
        }

        if (active) {
          setSuggestions(recipesData.suggestions as RecipeSuggestion[]);
          setSelectedMissingIngredients({});
          setSelectionMessages({});
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Impossible de charger les recettes.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipes();

    return () => {
      active = false;
    };
  }, [navigate, requestedHouseholdId, requestedIngredient]);

  function toggleMissingIngredient(
    recipeId: string,
    ingredient: string,
  ) {
    setSelectionMessages((current) => ({
      ...current,
      [recipeId]: "",
    }));

    setSelectedMissingIngredients((current) => {
      const recipeSelection = current[recipeId] ?? [];

      if (recipeSelection.includes(ingredient)) {
        return {
          ...current,
          [recipeId]: recipeSelection.filter(
            (item) => item !== ingredient,
          ),
        };
      }

      return {
        ...current,
        [recipeId]: [...recipeSelection, ingredient],
      };
    });
  }

  async function addSelectionToShoppingList(recipeId: string) {
    const recipeSelection =
      selectedMissingIngredients[recipeId] ?? [];

    if (recipeSelection.length === 0) {
      setSelectionMessages((current) => ({
        ...current,
        [recipeId]:
          "Choisissez au moins un ingr\u00e9dient manquant.",
      }));
      return;
    }

    if (!household || addingRecipeId !== null) return;

    try {
      setAddingRecipeId(recipeId);
      setError("");

      setSelectionMessages((current) => ({
        ...current,
        [recipeId]: "",
      }));

      const response = await fetch("/api/shopping-list/from-recipe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: household.id,
          items: recipeSelection.map((name) => ({ name })),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Impossible d'ajouter les ingr\u00e9dients \u00e0 la liste.",
        );
      }

      const addedCount = Number(data.addedCount ?? 0);
      const mergedCount = Number(data.mergedCount ?? 0);

      setSelectedMissingIngredients((current) => ({
        ...current,
        [recipeId]: [],
      }));

      setSelectionMessages((current) => ({
        ...current,
        [recipeId]:
          `${addedCount} ingr\u00e9dient(s) ajout\u00e9(s) et ${mergedCount} fusionn\u00e9(s) dans la liste d'\u00e9picerie.`,
      }));
    } catch (caughtError) {
      setSelectionMessages((current) => ({
        ...current,
        [recipeId]:
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible d'ajouter les ingr\u00e9dients \u00e0 la liste.",
      }));
    } finally {
      setAddingRecipeId(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="content-page">
        <p className="eyebrow">Recettes</p>

        <h1>Transformez vos aliments en idées de repas.</h1>

        {household && (
          <p>
            Suggestions préparées à partir de l'inventaire de{" "}
            <strong>{household.name}</strong>.
          </p>
        )}

        {requestedIngredient && household && (
          <p role="status">
            Alerte sélectionnée : recherche d'une recette utilisant{" "}
            <strong>{requestedIngredient}</strong>.
          </p>
        )}

        {isLoading && <p>Chargement des recettes...</p>}

        {error && <p role="alert">{error}</p>}

        {!isLoading && !error && !household && (
          <div className="page-placeholder">
            <h2>Aucun foyer</h2>
            <p>
              Créez d'abord un foyer et ajoutez des aliments à son inventaire.
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          household &&
          suggestions.length === 0 && (
            <div className="page-placeholder">
              <h2>Aucune recette disponible</h2>
              <p>
                Ajoutez des aliments dans votre inventaire pour recevoir une
                suggestion de recette.
              </p>
            </div>
          )}

        {!isLoading &&
          !error &&
          suggestions.map((recipe, recipeIndex) => (
            <article className="panel" key={recipe.id}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">
                    {recipeIndex === 0
                      ? "Suggestion prioritaire"
                      : "Autre suggestion"}
                  </p>

                  <h2>{recipe.name}</h2>
                </div>
              </div>

              <section>
                <h3>Pourquoi cette recette ?</h3>

                <p>{recipe.recommendationReason}</p>

                {recipe.preferenceApplied && (
                  <p role="status">
                    Cette suggestion tient compte de vos préférences alimentaires.
                  </p>
                )}

                <p>
                  <strong>Aliment prioritaire :</strong>{" "}
                  {recipe.priorityIngredient.name}
                </p>

                {recipe.priorityIngredient.daysUntilExpiration !== null && (
                  <p>
                    <strong>Expiration :</strong>{" "}
                    {recipe.priorityIngredient.daysUntilExpiration === 0
                      ? "aujourd'hui"
                      : recipe.priorityIngredient.daysUntilExpiration === 1
                        ? "demain"
                        : recipe.priorityIngredient.daysUntilExpiration > 1
                          ? `dans ${recipe.priorityIngredient.daysUntilExpiration} jours`
                          : "date dépassée"}
                  </p>
                )}
              </section>

              <section>
                <h3>Ingrédients disponibles</h3>

                {recipe.availableIngredients.length > 0 ? (
                  <ul>
                    {recipe.availableIngredients.map((ingredient) => (
                      <li key={ingredient}>
                        {ingredient} — déjà dans votre inventaire
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucun ingrédient disponible.</p>
                )}
              </section>

              <section>
                <h3>Ingrédients manquants</h3>

                {recipe.missingIngredients.length > 0 ? (
                  <>
                    <p>
                      Sélectionnez les ingrédients à ajouter à la liste
                      d'épicerie collaborative.
                    </p>

                    <div>
                      {recipe.missingIngredients.map((ingredient) => (
                        <label
                          key={ingredient}
                          style={{
                            display: "block",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={(
                              selectedMissingIngredients[recipe.id] ?? []
                            ).includes(ingredient)}
                            onChange={() =>
                              toggleMissingIngredient(recipe.id, ingredient)
                            }
                          />{" "}
                          {ingredient}
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        void addSelectionToShoppingList(recipe.id)
                      }
                      disabled={addingRecipeId !== null}
                    >
                      {addingRecipeId === recipe.id
                        ? "Ajout \u00e0 la liste..."
                        : "Ajouter \u00e0 la liste d'\u00e9picerie"}
                    </button>

                    {selectionMessages[recipe.id] && (
                      <>
                        <p role="status">
                          {selectionMessages[recipe.id]}
                        </p>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => navigate("/shopping-list")}
                        >
                          Voir la liste
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <p>
                    Tous les ingrédients nécessaires sont déjà disponibles.
                  </p>
                )}
              </section>
            </article>
          ))}
      </section>
    </main>
  );
}
