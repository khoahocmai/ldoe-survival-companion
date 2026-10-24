import { describe, it, expect } from 'vitest';
import { calculateModdedStats, aggregateModMaterials, extractActiveSkills } from './weaponModCalculator';
import { Item, WeaponMod } from '../../types';

describe('Task 4: Weapon Mod Calculator', () => {
  const sampleWeapon: Item = {
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

  const tacticalBlade: WeaponMod = {
    id: 'mod_cleaver_tactical_blade',
    weaponId: 'cleaver',
    slot: 'blade',
    name: 'Tactical Butcher Blade',
    vietnameseName: 'Lưỡi dao mổ chiến thuật',
    rarity: 'rare',
    stats: {
      damage: 4,
      attackSpeed: 0.08,
      critChance: 10,
      critDamage: 15,
      durability: 15,
    },
    materials: [
      { itemId: 'steel_bar', quantity: 5 },
      { itemId: 'duct_tape', quantity: 8 },
    ],
  };

  const hunterHandle: WeaponMod = {
    id: 'mod_cleaver_hunter_handle',
    weaponId: 'cleaver',
    slot: 'handle',
    name: 'Hunter Handle',
    vietnameseName: 'Tay cầm thợ săn',
    rarity: 'rare',
    stats: {
      damage: 2,
      attackSpeed: 0.06,
      critChance: 8,
      durability: 10,
    },
    materials: [
      { itemId: 'leather', quantity: 10 },
      { itemId: 'duct_tape', quantity: 6 },
    ],
  };

  const purpleBladeWithSkill: WeaponMod = {
    id: 'mod_cleaver_hunter_blade',
    weaponId: 'cleaver',
    slot: 'blade',
    name: "Hunter's Blade",
    vietnameseName: 'Lưỡi dao thợ săn',
    rarity: 'extremely_rare',
    stats: {
      damage: 6,
      durability: 25,
    },
    activeSkill: 'Chém xoáy (Whirlwind Slash)',
    materials: [{ itemId: 'steel_bar', quantity: 8 }],
  };

  it('should return base stats when no mods are equipped', () => {
    const res = calculateModdedStats(sampleWeapon, []);
    expect(res.damage).toBe(17);
    expect(res.damageDelta).toBe(0);
    expect(res.attackSpeed).toBe(1.4);
    expect(res.attackSpeedDelta).toBe(0);
    expect(res.durability).toBe(90);
    expect(res.durabilityDelta).toBe(0);
    expect(res.dps).toBe(23.8);
    expect(res.activeSkills).toEqual([]);
  });

  it('should correctly sum bonuses from multiple mods (meta cleaver combo)', () => {
    const res = calculateModdedStats(sampleWeapon, [tacticalBlade, hunterHandle]);
    // Damage: 17 + 4 + 2 = 23 (+6)
    expect(res.damage).toBe(23);
    expect(res.damageDelta).toBe(6);
    // Speed: 1.4 + 0.08 + 0.06 = 1.54 (+0.14)
    expect(res.attackSpeed).toBe(1.54);
    expect(res.attackSpeedDelta).toBe(0.14);
    // Durability: 90 + 15 + 10 = 115 (+25)
    expect(res.durability).toBe(115);
    expect(res.durabilityDelta).toBe(25);
    // Crit
    expect(res.critChance).toBe(18);
    expect(res.critDamage).toBe(15);
    // DPS: 23 * 1.54 = 35.4
    expect(res.dps).toBe(35.4);
  });

  it('should correctly handle negative stat debuffs', () => {
    const heavyBlade: WeaponMod = {
      id: 'mod_cleaver_heavy',
      weaponId: 'cleaver',
      slot: 'blade',
      name: 'Heavy Blade',
      vietnameseName: 'Lưỡi nặng',
      rarity: 'common',
      stats: {
        damage: 5,
        attackSpeed: -0.05,
      },
      materials: [{ itemId: 'iron_plate', quantity: 5 }],
    };

    const res = calculateModdedStats(sampleWeapon, [heavyBlade]);
    expect(res.damage).toBe(22);
    expect(res.damageDelta).toBe(5);
    expect(res.attackSpeed).toBe(1.35);
    expect(res.attackSpeedDelta).toBe(-0.05);
  });

  it('should aggregate materials and merge common itemIds', () => {
    const mats = aggregateModMaterials([tacticalBlade, hunterHandle]);
    // duct_tape is in both (8 + 6 = 14)
    const tape = mats.find((m) => m.itemId === 'duct_tape');
    expect(tape).toBeDefined();
    expect(tape!.quantity).toBe(14);

    const steel = mats.find((m) => m.itemId === 'steel_bar');
    expect(steel).toBeDefined();
    expect(steel!.quantity).toBe(5);

    const leather = mats.find((m) => m.itemId === 'leather');
    expect(leather).toBeDefined();
    expect(leather!.quantity).toBe(10);
  });

  it('should extract active skills', () => {
    const skills = extractActiveSkills([tacticalBlade, purpleBladeWithSkill]);
    expect(skills).toEqual(['Chém xoáy (Whirlwind Slash)']);
  });
});
