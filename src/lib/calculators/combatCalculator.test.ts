import { describe, it, expect } from 'vitest';
import { calculateCombat, compareWeapons } from './combatCalculator';
import { Item, Enemy } from '../../types';

describe('combatCalculator', () => {
  const dummyCleaver: Item = {
    id: 'cleaver',
    name: 'Cleaver',
    category: 'weapon_melee',
    rarity: 'common',
    stackSize: 1,
    description: 'Meat cleaver',
    weaponStats: {
      damage: 17,
      attackSpeed: 1.4,
      durability: 90,
      range: 1.2,
      sneakMultiplier: 3,
      isFirearm: false,
    },
    verificationStatus: 'verified',
  };

  const dummySawBlade: Item = {
    id: 'saw_blade_mace',
    name: 'Saw Blade Mace',
    category: 'weapon_melee',
    rarity: 'epic',
    stackSize: 1,
    description: 'Heavy saw mace',
    weaponStats: {
      damage: 55,
      attackSpeed: 0.7,
      durability: 30,
      range: 1.5,
      sneakMultiplier: 3,
      isFirearm: false,
    },
    verificationStatus: 'verified',
  };

  const dummyGlock: Item = {
    id: 'glock_17',
    name: 'Glock 17',
    category: 'weapon_firearm',
    rarity: 'rare',
    stackSize: 1,
    description: 'Pistol',
    weaponStats: {
      damage: 20,
      attackSpeed: 3.3,
      durability: 100,
      range: 35.0,
      sneakMultiplier: 1,
      isFirearm: true,
    },
    verificationStatus: 'verified',
  };

  const dummyRoamer: Enemy = {
    id: 'roamer',
    name: 'Roamer',
    category: 'zombie',
    hp: 40,
    damage: 6,
    armor: 0,
    dangerRating: 1,
    description: 'Slow zombie',
    drops: [],
    locations: [],
    verificationStatus: 'verified',
  };

  const dummyFastBiter: Enemy = {
    id: 'fast_biter',
    name: 'Fast Biter',
    category: 'zombie',
    hp: 80,
    damage: 15,
    armor: 0,
    dangerRating: 2,
    description: 'Fast zombie',
    drops: [],
    locations: [],
    verificationStatus: 'verified',
  };

  const dummyFG: Enemy = {
    id: 'frenzied_giant',
    name: 'Frenzied Giant',
    category: 'zombie',
    hp: 500,
    damage: 80,
    armor: 0,
    dangerRating: 4,
    description: 'One shot monster',
    drops: [],
    locations: [],
    verificationStatus: 'verified',
  };

  it('calculates regular hits to kill without sneak attack', () => {
    // Roamer has 40 HP, Cleaver does 17 dmg -> ceil(40 / 17) = 3 hits
    const result = calculateCombat({
      enemy: dummyRoamer,
      weapon: dummyCleaver,
      durabilityPercent: 100,
      isSneakAttack: false,
    });

    expect(result.isValid).toBe(true);
    expect(result.hitsToKill).toBe(3);
    expect(result.durabilityConsumedPerKill).toBe(3);
    // 90 total durability / 3 per kill = 30 roamers
    expect(result.enemiesKillable).toBe(30);
  });

  it('calculates sneak attack 1-hit kill when sneak dmg exceeds enemy HP', () => {
    // Fast Biter: 80 HP. Saw Blade Mace does 55 dmg, sneak x3 = 165 dmg >= 80 HP -> 1 hit
    const result = calculateCombat({
      enemy: dummyFastBiter,
      weapon: dummySawBlade,
      durabilityPercent: 100,
      isSneakAttack: true,
    });

    expect(result.isValid).toBe(true);
    expect(result.hitsToKill).toBe(1);
    expect(result.firstHitDamage).toBe(165);
    expect(result.enemiesKillable).toBe(30); // 30 durability / 1 = 30 enemies
  });

  it('calculates sneak attack followed by regular hits', () => {
    // Fast Biter: 80 HP. Cleaver: 17 dmg, sneak x3 = 51 dmg. Remaining HP: 80 - 51 = 29.
    // 29 / 17 dmg = 2 more hits. Total hits = 1 + 2 = 3 hits.
    const result = calculateCombat({
      enemy: dummyFastBiter,
      weapon: dummyCleaver,
      durabilityPercent: 100,
      isSneakAttack: true,
    });

    expect(result.isValid).toBe(true);
    expect(result.hitsToKill).toBe(3);
    expect(result.firstHitDamage).toBe(51);
  });

  it('calculates remaining durability percentage correctly', () => {
    // Cleaver has 90 durability. At 50%, remaining is 45.
    // Roamer takes 3 hits to kill. 45 / 3 = 15 kills.
    const result = calculateCombat({
      enemy: dummyRoamer,
      weapon: dummyCleaver,
      durabilityPercent: 50,
      isSneakAttack: false,
    });

    expect(result.isValid).toBe(true);
    expect(result.effectiveDurability).toBe(45);
    expect(result.enemiesKillable).toBe(15);
  });

  it('handles custom damage overrides', () => {
    // Custom damage set to 20 on Cleaver against Roamer (40 HP) -> ceil(40 / 20) = 2 hits
    const result = calculateCombat({
      enemy: dummyRoamer,
      weapon: dummyCleaver,
      durabilityPercent: 100,
      isSneakAttack: false,
      customDamage: 20,
    });

    expect(result.isValid).toBe(true);
    expect(result.hitsToKill).toBe(2);
    expect(result.effectiveDamagePerHit).toBe(20);
  });

  it('reports missing data when weapon stats are missing', () => {
    const invalidWeapon: Item = {
      ...dummyCleaver,
      weaponStats: undefined,
    };

    const result = calculateCombat({
      enemy: dummyRoamer,
      weapon: invalidWeapon,
      durabilityPercent: 100,
      isSneakAttack: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('weaponStats');
  });

  it('compares multiple weapons against a target enemy', () => {
    const comparisons = compareWeapons(dummyFG, [dummyCleaver, dummyGlock, dummySawBlade]);
    expect(comparisons.length).toBe(3);
    // Glock: 500 HP / 20 dmg = 25 hits
    const glockComp = comparisons.find((c) => c.weaponId === 'glock_17');
    expect(glockComp?.hitsToKill).toBe(25);
    expect(glockComp?.timeToKillSeconds).toBeCloseTo(25 / 3.3, 1);
  });
});
