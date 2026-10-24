import { describe, it, expect, vi } from 'vitest';
import { calculateModdedStats, aggregateModMaterials } from '../../lib/calculators/weaponModCalculator';
import { Item, WeaponMod } from '../../types';

describe('Task 5: WeaponModsPage logic & rendering support', () => {
  const cleaver: Item = {
    id: 'cleaver',
    name: 'Cleaver',
    vietnameseName: 'Dao chặt thịt',
    description: 'Vũ khí cận chiến rất nhanh',
    category: 'weapon_melee',
    rarity: 'common',
    stackSize: 1,
    weaponStats: {
      damage: 17,
      attackSpeed: 1.4,
      durability: 90,
      range: 1.2,
      sneakMultiplier: 3,
      isFirearm: false,
      dps: 23.8,
    },
  };

  const bladeMod: WeaponMod = {
    id: 'mod_cleaver_tactical_blade',
    weaponId: 'cleaver',
    slot: 'blade',
    name: 'Tactical Butcher Blade',
    vietnameseName: 'Lưỡi dao mổ chiến thuật',
    rarity: 'rare',
    stats: { damage: 4, attackSpeed: 0.08 },
    materials: [{ itemId: 'steel_bar', quantity: 5 }],
  };

  const handleMod: WeaponMod = {
    id: 'mod_cleaver_hunter_handle',
    weaponId: 'cleaver',
    slot: 'handle',
    name: 'Hunter Handle',
    vietnameseName: 'Tay cầm thợ săn',
    rarity: 'rare',
    stats: { damage: 2, attackSpeed: 0.06 },
    materials: [{ itemId: 'leather', quantity: 10 }],
  };

  it('calculates total stats accurately for cleaver meta build', () => {
    const stats = calculateModdedStats(cleaver, [bladeMod, handleMod]);
    expect(stats.damage).toBe(23);
    expect(stats.damageDelta).toBe(6);
    expect(stats.attackSpeed).toBe(1.54);
  });

  it('aggregates materials correctly for multiple mods', () => {
    const materials = aggregateModMaterials([bladeMod, handleMod]);
    expect(materials).toHaveLength(2);
    expect(materials.map((m) => m.itemId)).toContain('steel_bar');
    expect(materials.map((m) => m.itemId)).toContain('leather');
  });
});
