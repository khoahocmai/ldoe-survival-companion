import { describe, it, expect } from 'vitest';
import itemsData from '../../public/data/items.json';
import type { WeaponMod, WeaponModSlot, WeaponModStatBonus } from './index';

describe('Task 1: Weapon Mod Types & Components', () => {
  it('should have required mod crafting materials in items.json', () => {
    const requiredItemIds = [
      'factory_parts',
      'carbon_composite',
      'spring',
      'hi_tech_component',
      'oil',
      'lens',
    ];

    const existingIds = new Set(itemsData.map((i: any) => i.id));
    for (const reqId of requiredItemIds) {
      expect(existingIds.has(reqId), `Missing mod crafting material in items.json: ${reqId}`).toBe(true);
    }
  });

  it('should support WeaponMod typing constructs', () => {
    const slot: WeaponModSlot = 'blade';
    const stats: WeaponModStatBonus = {
      damage: 4,
      attackSpeed: 0.08,
      critChance: 10,
    };
    const sampleMod: WeaponMod = {
      id: 'mod_cleaver_tactical_blade',
      weaponId: 'cleaver',
      slot,
      name: 'Tactical Butcher Blade',
      vietnameseName: 'Lưỡi dao mổ chiến thuật',
      rarity: 'rare',
      stats,
      materials: [{ itemId: 'steel_bar', quantity: 4 }],
    };

    expect(sampleMod.id).toBe('mod_cleaver_tactical_blade');
    expect(sampleMod.stats.damage).toBe(4);
  });
});
