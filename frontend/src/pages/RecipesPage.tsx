import { useSearchParams } from "react-router-dom";

export function RecipesPage() {
  const [searchParams] = useSearchParams();
  const ingredient = searchParams.get("ingredient")?.trim() ?? "";

  return (
    <main className="page-shell">
      <section className="content-page">
        <p className="eyebrow">Recettes</p>
        <h1>Transformez vos aliments en idées de repas.</h1>

        {ingredient ? (
          <p>
            Aliment prioritaire : <strong>{ingredient}</strong>
          </p>
        ) : (
          <p>
            Cette page accueillera les recettes et les suggestions liées aux
            aliments disponibles dans l'inventaire lorsque les récits
            correspondants seront intégrés.
          </p>
        )}

        <div className="page-placeholder">
          <h2>
            {ingredient
              ? `Recettes à partir de ${ingredient}`
              : "Fonctionnalités prévues"}
          </h2>

          {ingredient ? (
            <p>
              MealSaver utilisera cet aliment prioritaire pour proposer des
              recettes lorsque la fonctionnalité Recettes sera intégrée.
            </p>
          ) : (
            <ul>
              <li>Consulter des recettes</li>
              <li>Utiliser les aliments disponibles</li>
              <li>Réduire les achats et le gaspillage inutiles</li>
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}