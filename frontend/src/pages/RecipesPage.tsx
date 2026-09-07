import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  isFallback: boolean;
};

export function RecipesPage() {
  const navigate = useNavigate();

  const [household, setHousehold] = useState<Household | null>(null);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [selectedMissingIngredients, setSelectedMissingIngredients] = useState<
    string[]
  >([]);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecipes() {
      try {
        setIsLoading(true);
        setError("");
        setSelectionMessage("");

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

        const selectedHousehold = households[0]!;

        if (active) {
          setHousehold(selectedHousehold);
        }

        const recipesResponse = await fetch(
          `/api/recipes?householdId=${selectedHousehold.id}`,
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
          setSelectedMissingIngredients([]);
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error
              ? error.message
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
  }, [navigate]);

  function toggleMissingIngredient(ingredient: string) {
    setSelectionMessage("");

    setSelectedMissingIngredients((current) => {
      if (current.includes(ingredient)) {
        return current.filter((item) => item !== ingredient);
      }

      return [...current, ingredient];
    });
  }

  function prepareShoppingListSelection() {
    if (selectedMissingIngredients.length === 0) {
      setSelectionMessage(
        "Choisissez au moins un ingrédient manquant.",
      );

      return;
    }

    setSelectionMessage(
      `${selectedMissingIngredients.length} ingrédient(s) sélectionné(s) pour la liste d'épicerie.`,
    );

    /*
     * MEALSAVER-37 :
     * Le raccordement réel à la liste d'épicerie sera effectué
     * lorsque le travail MEALSAVER-39/40/41 de Jean Jacques
     * sera intégré.
     */
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
          suggestions.map((recipe) => (
            <article className="panel" key={recipe.id}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">
                    {recipe.isFallback
                      ? "Idée anti-gaspillage"
                      : "Suggestion prioritaire"}
                  </p>

                  <h2>{recipe.name}</h2>
                </div>
              </div>

              <section>
                <h3>Pourquoi cette recette ?</h3>

                <p>{recipe.recommendationReason}</p>

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
                      Sélectionnez les ingrédients que vous souhaitez ajouter
                      à votre future liste d'épicerie.
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
                            checked={selectedMissingIngredients.includes(
                              ingredient,
                            )}
                            onChange={() =>
                              toggleMissingIngredient(ingredient)
                            }
                          />{" "}
                          {ingredient}
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={prepareShoppingListSelection}
                    >
                      Préparer la sélection pour la liste
                    </button>

                    {selectionMessage && (
                      <p role="status">{selectionMessage}</p>
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