import { describe, it, expect } from 'vitest';
import {
  calculateSingleEnemyPointKills,
  calculateMixedEnemyPoints,
  getEnemyPoints,
} from './pointCalculator';
import { Enemy, EnemyPointRule, PointSystem } from '../../types';

describe('pointCalculator', () => {
  const dummyPointSystem: PointSystem = {
    id: 'supply_event',
    name: 'Sự kiện Tiếp tế (Supply Event)',
    unit: 'Điểm kiểm soát',
    milestones: [
      { id: 'common', name: 'Hòm thông thường', points: 250 },
      { id: 'high_value', name: 'Hòm giá trị cao', points: 1200 },
      { id: 'extremely_valuable', name: 'Hòm cực kỳ giá trị', points: 1500 },
    ],
  };

  const dummyRules: EnemyPointRule[] = [
    { id: 'r1', pointSystemId: 'supply_event', enemyId: 'roamer', points: 1 },
    { id: 'r2', pointSystemId: 'supply_event', enemyId: 'fast_biter', points: 2 },
    { id: 'r3', pointSystemId: 'supply_event', enemyId: 'floater_bloater', points: 5 },
    { id: 'r4', pointSystemId: 'supply_event', enemyId: 'toxic_abomination', points: 7 },
    { id: 'r5', pointSystemId: 'supply_event', enemyId: 'frenzied_giant', points: 15 },
    { id: 'r6', pointSystemId: 'supply_event', enemyId: 'the_blind_one', points: 50 },
    // Arena wave exclusion: 0 points for PD arena
    {
      id: 'r_pd_roamer',
      pointSystemId: 'supply_event',
      enemyId: 'roamer',
      locationId: 'blackport_pd',
      points: 0,
      notes: 'Zombies trong đấu trường PD không cộng điểm Supply',
    },
    // Unknown points enemy
    { id: 'r_unknown', pointSystemId: 'supply_event', enemyId: 'unknown_boss', points: null },
  ];

  const dummyEnemies: Enemy[] = [
    {
      id: 'roamer',
      name: 'Roamer',
      category: 'zombie',
      hp: 40,
      damage: 6,
      armor: 0,
      dangerRating: 1,
      description: '',
      drops: [],
      locations: [],
    },
    {
      id: 'floater_bloater',
      name: 'Floater Bloater',
      category: 'zombie',
      hp: 240,
      damage: 20,
      armor: 0,
      dangerRating: 3,
      description: '',
      drops: [],
      locations: [],
    },
    {
      id: 'frenzied_giant',
      name: 'Frenzied Giant',
      category: 'zombie',
      hp: 500,
      damage: 80,
      armor: 0,
      dangerRating: 4,
      description: '',
      drops: [],
      locations: [],
    },
    {
      id: 'unknown_boss',
      name: 'Unknown Boss',
      category: 'boss',
      hp: 1000,
      damage: 100,
      armor: 0,
      dangerRating: 5,
      description: '',
      drops: [],
      locations: [],
    },
  ];

  const enemiesMap = new Map<string, Enemy>(dummyEnemies.map((e) => [e.id, e]));

  describe('getEnemyPoints', () => {
    it('returns general rule points when no location override is given', () => {
      const res = getEnemyPoints('supply_event', 'frenzied_giant', dummyRules);
      expect(res.points).toBe(15);
    });

    it('returns location override points when location matches', () => {
      const res = getEnemyPoints('supply_event', 'roamer', dummyRules, 'blackport_pd');
      expect(res.points).toBe(0);
      expect(res.notes).toContain('PD không cộng điểm');
    });

    it('applies a wildcard location rule to every enemy at that location', () => {
      const rules: EnemyPointRule[] = [
        { id: 'a', pointSystemId: 'supply_event', enemyId: 'fast_biter', points: 2 },
        { id: 'pd', pointSystemId: 'supply_event', enemyId: '*', locationId: 'blackport_pd', points: 0 },
      ];
      expect(getEnemyPoints('supply_event', 'fast_biter', rules, 'blackport_pd').points).toBe(0);
      expect(getEnemyPoints('supply_event', 'fast_biter', rules, 'pine_grove').points).toBe(2);
      expect(getEnemyPoints('supply_event', 'fast_biter', rules).points).toBe(2);
    });

    it('prefers an exact enemy rule over the location wildcard', () => {
      const rules: EnemyPointRule[] = [
        { id: 'pd', pointSystemId: 'supply_event', enemyId: '*', locationId: 'arena', points: 0 },
        { id: 'boss', pointSystemId: 'supply_event', enemyId: 'boss', locationId: 'arena', points: 9 },
      ];
      expect(getEnemyPoints('supply_event', 'boss', rules, 'arena').points).toBe(9);
      expect(getEnemyPoints('supply_event', 'other', rules, 'arena').points).toBe(0);
    });

    it('returns null for unknown enemy points', () => {
      const res = getEnemyPoints('supply_event', 'unknown_boss', dummyRules);
      expect(res.points).toBeNull();
    });
  });

  describe('calculateSingleEnemyPointKills', () => {
    it('calculates kills needed correctly for milestone target', () => {
      // Milestone 1500, FG gives 15 pts -> 1500 / 15 = 100 kills
      const calc = calculateSingleEnemyPointKills({
        pointSystem: dummyPointSystem,
        targetPoints: 1500,
        currentPoints: 0,
        rules: dummyRules,
        enemies: dummyEnemies,
      });

      expect(calc.remainingPoints).toBe(1500);

      const fg = calc.results.find((r) => r.enemyId === 'frenzied_giant');
      expect(fg?.isEligible).toBe(true);
      expect(fg?.killsNeeded).toBe(100);

      // Floater gives 5 pts -> 1500 / 5 = 300 kills
      const floater = calc.results.find((r) => r.enemyId === 'floater_bloater');
      expect(floater?.killsNeeded).toBe(300);
    });

    it('accounts for current points already gathered', () => {
      // Target 1500, current 1200 -> remaining 300 points.
      // Floater (5 pts) needs 300 / 5 = 60 kills
      const calc = calculateSingleEnemyPointKills({
        pointSystem: dummyPointSystem,
        targetPoints: 1500,
        currentPoints: 1200,
        rules: dummyRules,
        enemies: dummyEnemies,
      });

      expect(calc.remainingPoints).toBe(300);
      const floater = calc.results.find((r) => r.enemyId === 'floater_bloater');
      expect(floater?.killsNeeded).toBe(60);
    });

    it('handles unverified or zero-point enemies safely', () => {
      const calc = calculateSingleEnemyPointKills({
        pointSystem: dummyPointSystem,
        targetPoints: 500,
        rules: dummyRules,
        enemies: dummyEnemies,
        locationId: 'blackport_pd',
      });

      const roamer = calc.results.find((r) => r.enemyId === 'roamer');
      expect(roamer?.isEligible).toBe(false);
      expect(roamer?.killsNeeded).toBeNull();

      const unknown = calc.results.find((r) => r.enemyId === 'unknown_boss');
      expect(unknown?.isEligible).toBe(false);
      expect(unknown?.killsNeeded).toBeNull();
    });
  });

  describe('calculateMixedEnemyPoints', () => {
    it('aggregates points from mixed kill plan and calculates progress', () => {
      // 10 FGs (15 pts each = 150) + 20 Floaters (5 pts each = 100) = 250 pts
      // Target 1000, current 100 -> projected 350 -> remaining 650
      const calc = calculateMixedEnemyPoints({
        pointSystem: dummyPointSystem,
        targetPoints: 1000,
        currentPoints: 100,
        plannedKills: [
          { enemyId: 'frenzied_giant', killCount: 10 },
          { enemyId: 'floater_bloater', killCount: 20 },
        ],
        rules: dummyRules,
        enemiesMap,
      });

      expect(calc.pointsFromPlannedKills).toBe(250);
      expect(calc.totalProjectedPoints).toBe(350);
      expect(calc.remainingPoints).toBe(650);
      expect(calc.progressPercent).toBe(35);
      expect(calc.isTargetReached).toBe(false);
    });

    it('marks target as reached when total exceeds goal', () => {
      const calc = calculateMixedEnemyPoints({
        pointSystem: dummyPointSystem,
        targetPoints: 250,
        currentPoints: 0,
        plannedKills: [{ enemyId: 'frenzied_giant', killCount: 20 }], // 20 * 15 = 300
        rules: dummyRules,
        enemiesMap,
      });

      expect(calc.totalProjectedPoints).toBe(300);
      expect(calc.remainingPoints).toBe(0);
      expect(calc.isTargetReached).toBe(true);
      expect(calc.progressPercent).toBe(100);
    });
  });
});
