import React from "react";

export interface BudgetTotalsProps {
  memberTotals: Record<string, number>;
  generalTotal: number;
}

export const BudgetTotals: React.FC<BudgetTotalsProps> = ({
  memberTotals = {},
  generalTotal = 0,
}) => {
  const entries = Object.entries(memberTotals);
  const isEmpty = entries.length === 0 && generalTotal === 0;

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Total par membre</h3>
      {isEmpty ? (
        <p className="text-sm text-gray-500 italic">
          Aucune dépense enregistrée pour ce foyer.
        </p>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-gray-100">
            {entries.map(([member, total]) => (
              <li
                key={member}
                className="py-2 flex justify-between items-center text-sm"
              >
                <span className="text-gray-700 font-medium">{member}</span>
                <span className="font-semibold text-gray-900">
                  {total.toFixed(2)} $
                </span>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-base font-bold text-gray-900">
            <span>Total général</span>
            <span>{generalTotal.toFixed(2)} $</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetTotals;