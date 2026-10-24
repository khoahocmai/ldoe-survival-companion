import { describe, it, expect } from 'vitest';
import { modStatChips } from './modStats';

describe('modStatChips', () => {
  it('skips missing and zero bonuses and keeps a stable order', () => {
    const chips = modStatChips({ noise: -10, damage: 4, attackSpeed: 0, durability: 15 });
    expect(chips.map((c) => c.key)).toEqual(['damage', 'durability', 'noise']);
  });

  it('formats signs and units', () => {
    const chips = modStatChips({ damage: -2, attackSpeed: 0.08, critChance: 10 });
    expect(chips.map((c) => c.text)).toEqual(['-2', '+0.08/s', '+10%']);
  });

  it('colours by whether the change is good, with lower noise being good', () => {
    const byKey = Object.fromEntries(modStatChips({ damage: -2, noise: -10, durability: 5 }).map((c) => [c.key, c.tone]));
    expect(byKey).toMatchObject({ damage: 'danger', noise: 'ok', durability: 'ok' });
    expect(modStatChips({ noise: 8 })[0].tone).toBe('danger');
  });
});
