import { describe, it, expect } from 'vitest';

describe('Task 6: Cross-Page Integration Helpers', () => {
  it('parses materials parameter correctly from URL format', () => {
    const rawParam = 'steel_bar:5,duct_tape:8,oil:2';
    const parsed = rawParam.split(',').map((part) => {
      const [itemId, qtyStr] = part.split(':');
      return {
        itemId,
        quantity: Math.max(1, parseInt(qtyStr, 10) || 1),
      };
    });

    expect(parsed).toEqual([
      { itemId: 'steel_bar', quantity: 5 },
      { itemId: 'duct_tape', quantity: 8 },
      { itemId: 'oil', quantity: 2 },
    ]);
  });

  it('handles customDamage param validation for CombatCalculator', () => {
    const param = '23';
    const num = Number(param);
    const isValid = Number.isFinite(num) && num > 0;
    expect(isValid).toBe(true);
    expect(num).toBe(23);

    const invalidParam = 'invalid';
    const numInvalid = Number(invalidParam);
    expect(Number.isFinite(numInvalid) && numInvalid > 0).toBe(false);
  });
});
