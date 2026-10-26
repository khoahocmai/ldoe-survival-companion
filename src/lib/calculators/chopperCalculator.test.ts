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
    it('calculates EXP, level-up and remaining requirement correctly for user screenshot scenario', () => {
      // User is Lvl 42, 3610 / 4500 EXP (needs 890 to reach 43)
      // When donating only 100 bolts (+300 EXP):
      // totalExpProgress = 3910, remainingExpToNextLevel = 590, isLevelUpSatisfied: false
      const partialResult = calculateChopperUpgrade({
        currentLevel: 42,
        currentExp: 3610,
        donations: { bolt: 100 },
        acceptedItems: DEFAULT_CHOPPER_ACCEPTED_ITEMS,
      });

      expect(partialResult.totalExpGained).toBe(300);
      expect(partialResult.remainingExpToNextLevel).toBe(590);
      expect(partialResult.isLevelUpSatisfied).toBe(false);
      expect(partialResult.newLevel).toBe(42);

      // When adding 50 bearings (+250), 15 iron plates (+300), 8 thick leather (+40) -> total 890 EXP -> Level 43!
      const fullResult = calculateChopperUpgrade({
        currentLevel: 42,
        currentExp: 3610,
        donations: {
          bolt: 100,
          ball_bearing: 50,
          iron_plate: 15,
          thick_leather: 8,
        },
        acceptedItems: DEFAULT_CHOPPER_ACCEPTED_ITEMS,
      });

      expect(fullResult.totalExpGained).toBe(890);
      expect(fullResult.remainingExpToNextLevel).toBe(0);
      expect(fullResult.isLevelUpSatisfied).toBe(true);
      expect(fullResult.newLevel).toBe(43);
      expect(fullResult.newExp).toBe(0);
      expect(fullResult.levelsGained).toBe(1);
      expect(fullResult.perkRollsAvailable).toBe(1);
    });

    it('handles multiple level jumps when large exp is donated', () => {
      // 5 Chopper magazines (+5000 EXP) from Level 1
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
      expect(result.isLevelUpSatisfied).toBe(true);
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
      expect(result.remainingExpToNextLevel).toBe(0);
    });

    it('allows entering rare resources without throwing errors or warnings', () => {
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

      // 5*75 (375) + 3*100 (300) + 10*50 (500) + 10*20 (200) = 1375 EXP
      expect(result.totalExpGained).toBe(1375);
      expect(result.donatedBreakdown.length).toBe(4);
      expect(result.isLevelUpSatisfied).toBe(true);
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
