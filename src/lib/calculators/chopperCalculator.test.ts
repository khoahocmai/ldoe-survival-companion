import { describe, it, expect } from 'vitest';
import {
  getChopperRequiredExp,
  calculateChopperUpgrade,
  getOptimalJunkCombo,
  DEFAULT_CHOPPER_ACCEPTED_ITEMS,
} from './chopperCalculator';

describe('chopperCalculator', () => {
  describe('getChopperRequiredExp', () => {
    it('returns exact 4500 EXP for level 42 matching in-game mechanics', () => {
      expect(getChopperRequiredExp(42)).toBe(4500);
    });

    it('returns 1500 EXP for level 1', () => {
      expect(getChopperRequiredExp(1)).toBe(1500);
    });

    it('returns 0 for max level 100', () => {
      expect(getChopperRequiredExp(100)).toBe(0);
    });
  });

  describe('calculateChopperUpgrade', () => {
    it('calculates EXP and level-up correctly for user screenshot scenario', () => {
      // User is Lvl 42, 3610 / 4500 EXP (needs 890 to reach 43)
      // Inventory: 100 bolts (+300), 50 ball_bearings (+250), 15 iron_plates (+300) = 850 EXP
      // Plus 8 thick_leather (+40 EXP) = 890 EXP -> Level 43!
      const donations = {
        bolt: 100,
        ball_bearing: 50,
        iron_plate: 15,
        thick_leather: 8,
      };

      const result = calculateChopperUpgrade({
        currentLevel: 42,
        currentExp: 3610,
        donations,
        acceptedItems: DEFAULT_CHOPPER_ACCEPTED_ITEMS,
      });

      expect(result.totalExpGained).toBe(890);
      expect(result.newLevel).toBe(43);
      expect(result.newExp).toBe(0);
      expect(result.levelsGained).toBe(1);
      expect(result.perkRollsAvailable).toBe(1);
      expect(result.warnings.filter((w) => w.severity === 'danger').length).toBe(0);
      expect(result.warnings.some((w) => w.itemId === 'thick_leather')).toBe(true);
    });

    it('handles multiple level jumps when large exp is donated', () => {
      // 5 Chopper magazines (+5000 EXP) from Level 1 (needs 1500 to Lvl 2, ~1573 to Lvl 3...)
      const donations = {
        chopper_magazine: 5,
      };

      const result = calculateChopperUpgrade({
        currentLevel: 1,
        currentExp: 0,
        donations,
        acceptedItems: DEFAULT_CHOPPER_ACCEPTED_ITEMS,
      });

      expect(result.totalExpGained).toBe(5000);
      expect(result.newLevel).toBeGreaterThanOrEqual(3);
      expect(result.levelsGained).toBeGreaterThanOrEqual(2);
      expect(result.perkRollsAvailable).toBe(result.levelsGained);
    });

    it('caps at max level 100', () => {
      const donations = {
        chopper_magazine: 1000,
      };

      const result = calculateChopperUpgrade({
        currentLevel: 99,
        currentExp: 0,
        donations,
        acceptedItems: DEFAULT_CHOPPER_ACCEPTED_ITEMS,
      });

      expect(result.newLevel).toBe(100);
      expect(result.isMaxLevel).toBe(true);
      expect(result.newExp).toBe(0);
    });

    it('flags danger warnings when rare resources are donated', () => {
      const donations = {
        copper_bar: 5,
        aluminium_plate: 3,
        engine_part: 10,
        spring: 10,
      };

      const result = calculateChopperUpgrade({
        currentLevel: 42,
        currentExp: 3610,
        donations,
        acceptedItems: DEFAULT_CHOPPER_ACCEPTED_ITEMS,
      });

      expect(result.warnings.length).toBe(4);
      expect(result.warnings.some((w) => w.itemId === 'copper_bar')).toBe(true);
      expect(result.warnings.some((w) => w.itemId === 'engine_part')).toBe(true);
    });
  });

  describe('getOptimalJunkCombo', () => {
    it('returns only recommended items up to dailyLimit', () => {
      const combo = getOptimalJunkCombo(DEFAULT_CHOPPER_ACCEPTED_ITEMS);

      expect(combo.bolt).toBe(100);
      expect(combo.ball_bearing).toBe(50);
      expect(combo.iron_plate).toBe(15);
      expect(combo.copper_bar).toBeUndefined();
      expect(combo.engine_part).toBeUndefined();
      expect(combo.aluminium_plate).toBeUndefined();
    });
  });
});
