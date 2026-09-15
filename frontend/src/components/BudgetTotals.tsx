import React from "react";

export interface BudgetTotalsProps {
  memberTotals: Record<string, number>;
  generalTotal: number;
}

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
});

export const BudgetTotals: React.FC<BudgetTotalsProps> = ({
  memberTotals = {},
  generalTotal = 0,
}) => {
  const entries = Object.entries(memberTotals);
  const isEmpty = entries.length === 0 && generalTotal === 0;

  return (
    <section className="budget-card budget-totals-card">
      <div className="budget-card-header">
        <div className="budget-card-icon" aria-hidden="true">
          =
        </div>

        <div>
          <h2>Total par membre</h2>
          <p>
            {
              "R\u00e9partition des d\u00e9penses enregistr\u00e9es pour le foyer."
            }
          </p>
        </div>
      </div>

      {isEmpty ? (
        <p className="budget-empty">
          {
            "Aucune d\u00e9pense enregistr\u00e9e pour ce foyer."
          }
        </p>
      ) : (
        <div className="budget-totals-content">
          <ul className="budget-member-totals">
            {entries.map(([member, total]) => (
              <li key={member}>
                <span>{member}</span>
                <strong>{moneyFormatter.format(total)}</strong>
              </li>
            ))}
          </ul>

          <div className="budget-general-total">
            <span>
              {"Total g\u00e9n\u00e9ral"}
            </span>
            <strong>
              {moneyFormatter.format(generalTotal)}
            </strong>
          </div>
        </div>
      )}
    </section>
  );
};

export default BudgetTotals;
