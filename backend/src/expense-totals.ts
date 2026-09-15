// backend/src/expense-totals.ts
export interface ExpenseItem {
  amount: number | string;
  member: string;
}

export interface MemberTotalResult {
  memberTotals: Record<string, number>;
  generalTotal: number;
}

export function calculateExpenseTotals(expenses: ExpenseItem[]): MemberTotalResult {
  const memberTotals: Record<string, number> = {};
  let generalTotal = 0;

  for (const exp of expenses) {
    const val = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
    const numericVal = isNaN(val) ? 0 : val;
    
    const currentMemberVal = memberTotals[exp.member] || 0;
    memberTotals[exp.member] = Number((currentMemberVal + numericVal).toFixed(2));
    generalTotal = Number((generalTotal + numericVal).toFixed(2));
  }

  return { memberTotals, generalTotal };
}   