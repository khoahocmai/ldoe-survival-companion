import { Enemy, EnemyPointRule, PointMilestone, PointSystem } from '../../types';

export interface SingleEnemyKillRequirement {
  enemyId: string;
  enemyName: string;
  pointsPerKill: number | null;
  killsNeeded: number | null; // null if pointsPerKill is <= 0 or null
  isEligible: boolean;
  notes?: string;
}

export interface SingleEnemyPointCalcResult {
  targetPoints: number;
  currentPoints: number;
  remainingPoints: number;
  milestone?: PointMilestone;
  results: SingleEnemyKillRequirement[];
}

export interface MixedEnemyKillInput {
  enemyId: string;
  killCount: number;
}

export interface MixedEnemyPointItem {
  enemyId: string;
  enemyName: string;
  killCount: number;
  pointsPerKill: number;
  totalPoints: number;
  isEligible: boolean;
  notes?: string;
}

export interface MixedEnemyPointCalcResult {
  targetPoints: number;
  currentPoints: number; // initial points before planned kills
  pointsFromPlannedKills: number;
  totalProjectedPoints: number;
  remainingPoints: number;
  isTargetReached: boolean;
  progressPercent: number;
  items: MixedEnemyPointItem[];
}

/** `enemyId` value of a location rule that applies to every enemy at that location. */
export const WILDCARD_ENEMY = '*';

// Helper to look up points for an enemy in a point system (optionally at a location)
export function getEnemyPoints(
  pointSystemId: string,
  enemyId: string,
  rules: EnemyPointRule[],
  locationId?: string
): { points: number | null; notes?: string } {
  // Location specific rules win: an exact enemy match first, then a wildcard ('*') covering every enemy there.
  if (locationId) {
    const atLocation = rules.filter((r) => r.pointSystemId === pointSystemId && r.locationId === locationId);
    const locRule = atLocation.find((r) => r.enemyId === enemyId) ?? atLocation.find((r) => r.enemyId === WILDCARD_ENEMY);
    if (locRule) {
      return { points: locRule.points, notes: locRule.notes };
    }
  }

  // Fallback to general rule
  const rule = rules.find(
    (r) => r.pointSystemId === pointSystemId && r.enemyId === enemyId && !r.locationId
  );
  if (rule) {
    return { points: rule.points, notes: rule.notes };
  }

  return { points: null, notes: 'Không có dữ liệu điểm' };
}

export function calculateSingleEnemyPointKills(params: {
  pointSystem: PointSystem;
  targetPoints: number;
  currentPoints?: number;
  rules: EnemyPointRule[];
  enemies: Enemy[];
  locationId?: string;
}): SingleEnemyPointCalcResult {
  const current = Math.max(0, params.currentPoints || 0);
  const target = Math.max(0, params.targetPoints);
  const remaining = Math.max(0, target - current);

  const results: SingleEnemyKillRequirement[] = params.enemies.map((enemy) => {
    const ruleInfo = getEnemyPoints(params.pointSystem.id, enemy.id, params.rules, params.locationId);
    const pts = ruleInfo.points;

    if (pts === null || pts <= 0) {
      return {
        enemyId: enemy.id,
        enemyName: enemy.name,
        pointsPerKill: pts,
        killsNeeded: null,
        isEligible: false,
        notes: ruleInfo.notes || (pts === 0 ? 'Không cộng điểm tại địa điểm này' : 'Chưa có dữ liệu'),
      };
    }

    const killsNeeded = remaining === 0 ? 0 : Math.ceil(remaining / pts);
    return {
      enemyId: enemy.id,
      enemyName: enemy.name,
      pointsPerKill: pts,
      killsNeeded,
      isEligible: true,
      notes: ruleInfo.notes,
    };
  });

  return {
    targetPoints: target,
    currentPoints: current,
    remainingPoints: remaining,
    results,
  };
}

export function calculateMixedEnemyPoints(params: {
  pointSystem: PointSystem;
  targetPoints: number;
  currentPoints?: number;
  plannedKills: MixedEnemyKillInput[];
  rules: EnemyPointRule[];
  enemiesMap: Map<string, Enemy>;
  locationId?: string;
}): MixedEnemyPointCalcResult {
  const current = Math.max(0, params.currentPoints || 0);
  const target = Math.max(0, params.targetPoints);

  let plannedPoints = 0;
  const items: MixedEnemyPointItem[] = params.plannedKills.map((pk) => {
    const enemy = params.enemiesMap.get(pk.enemyId);
    const enemyName = enemy?.name || pk.enemyId;
    const ruleInfo = getEnemyPoints(params.pointSystem.id, pk.enemyId, params.rules, params.locationId);
    const pts = ruleInfo.points && ruleInfo.points > 0 ? ruleInfo.points : 0;
    const total = pts * Math.max(0, pk.killCount);
    plannedPoints += total;

    return {
      enemyId: pk.enemyId,
      enemyName,
      killCount: Math.max(0, pk.killCount),
      pointsPerKill: pts,
      totalPoints: total,
      isEligible: ruleInfo.points !== null && ruleInfo.points > 0,
      notes: ruleInfo.notes,
    };
  });

  const totalProjected = current + plannedPoints;
  const remaining = Math.max(0, target - totalProjected);
  const isTargetReached = totalProjected >= target;
  const progressPercent = target > 0 ? Math.min(100, Math.round((totalProjected / target) * 100)) : 100;

  return {
    targetPoints: target,
    currentPoints: current,
    pointsFromPlannedKills: plannedPoints,
    totalProjectedPoints: totalProjected,
    remainingPoints: remaining,
    isTargetReached,
    progressPercent,
    items,
  };
}
