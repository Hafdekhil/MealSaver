import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Household = {
  id: number;
  name: string;
  createdAt: string;
  role: "OWNER" | "MEMBER";
};

type RecipeSuggestion = {
  id: string;
  name: string;
  ingredients: string[];
  inventoryIngredients: string[];
};

export function RecipesPage() {
  const navigate = useNavigate();

  const [household, setHousehold] = useState<Household | null>(null);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecipes() {
      try {
        setIsLoading(true);
        setError("");

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
                  <p className="eyebrow">Suggestion du foyer</p>
                  <h2>{recipe.name}</h2>
                </div>
              </div>

              <div>
                <h3>Ingrédients de la recette</h3>

                <ul>
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient}>{ingredient}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Déjà dans votre inventaire</h3>

                <ul>
                  {recipe.inventoryIngredients.map((ingredient) => (
                    <li key={ingredient}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}