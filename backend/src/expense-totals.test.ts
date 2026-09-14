// backend/src/expense-totals.test.ts
import { describe, it, expect } from 'vitest';
import { calculateExpenseTotals } from './expense-totals.js';

describe('calculateExpenseTotals', () => {
  it('returns zeros for empty array', () => {
    const result = calculateExpenseTotals([]);
    expect(result).toEqual({ memberTotals: {}, generalTotal: 0 });
  });

  it('aggregates numeric amounts per member and general total', () => {
    const result = calculateExpenseTotals([
      { member: 'Alice', amount: 10.5 },
      { member: 'Bob', amount: 20 },
      { member: 'Alice', amount: 5.25 },
    ]);
    expect(result).toEqual({
      memberTotals: { Alice: 15.75, Bob: 20 },
      generalTotal: 35.75,
    });
  });

  it('handles string amounts and rounding properly', () => {
    const result = calculateExpenseTotals([
      { member: 'Alice', amount: '10.10' },
      { member: 'Alice', amount: '20.20' },
      { member: 'Bob', amount: '5.05' },
    ]);
    expect(result).toEqual({
      memberTotals: { Alice: 30.3, Bob: 5.05 },
      generalTotal: 35.35,
    });
  });

  it('handles NaN or invalid string amounts safely as zero', () => {
    const result = calculateExpenseTotals([
      { member: 'Alice', amount: 'invalid-number' },
      { member: 'Bob', amount: 15.45 },
    ]);
    expect(result).toEqual({
      memberTotals: { Alice: 0, Bob: 15.45 },
      generalTotal: 15.45,
    });
  });
});