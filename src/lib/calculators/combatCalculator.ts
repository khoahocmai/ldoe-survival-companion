import { Item, Enemy } from '../../types';

export interface CombatParams {
  enemy: Enemy;
  weapon: Item;
  durabilityPercent?: number; // 0 - 100, default 100
  isSneakAttack?: boolean; // default false
  customDamage?: number;
  durabilityPerHit?: number; // default 1
}

export interface CombatResult {
  isValid: boolean;
  missingFields: string[];
  enemyName: string;
  weaponName: string;
  effectiveDamagePerHit: number;
  firstHitDamage: number;
  hitsToKill: number;
  durabilityConsumedPerKill: number;
  effectiveDurability: number;
  enemiesKillable: number;
  timeToKillSeconds: number;
  dps: number;
  assumptions: string[];
}

export interface WeaponComparisonItem {
  weaponId: string;
  weaponName: string;
  damage: number;
  attackSpeed: number;
  hitsToKill: number;
  durabilityConsumedPerKill: number;
  enemiesKillable: number;
  timeToKillSeconds: number;
  isFirearm: boolean;
}

export function calculateCombat(params: CombatParams): CombatResult {
  const missingFields: string[] = [];

  if (!params.enemy) {
    missingFields.push('enemy');
  } else if (!params.enemy.hp) {
    missingFields.push('enemy.hp');
  }

  if (!params.weapon) {
    missingFields.push('weapon');
  } else if (!params.weapon.weaponStats) {
    missingFields.push('weaponStats');
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      missingFields,
      enemyName: params.enemy?.name || 'Unknown',
      weaponName: params.weapon?.name || 'Unknown',
      effectiveDamagePerHit: 0,
      firstHitDamage: 0,
      hitsToKill: 0,
      durabilityConsumedPerKill: 0,
      effectiveDurability: 0,
      enemiesKillable: 0,
      timeToKillSeconds: 0,
      dps: 0,
      assumptions: ['Thiếu thông số dữ liệu bắt buộc để tính toán chính xác.'],
    };
  }

  const { enemy, weapon } = params;
  const stats = weapon.weaponStats!;
  const durabilityPercent = Math.min(100, Math.max(0, params.durabilityPercent ?? 100));
  const durabilityPerHit = Math.max(1, params.durabilityPerHit ?? 1);

  // 1. Calculate damage accounting for custom overrides and armor
  const baseDamage = typeof params.customDamage === 'number' && params.customDamage > 0 ? params.customDamage : stats.damage;

  let effectiveDamagePerHit = baseDamage;
  const assumptions: string[] = [];

  if (enemy.armor && enemy.armor > 0) {
    // Standard LDoE armor damage reduction formula: effective = dmg * (1 - armor / 100)
    const reduced = Math.max(1, Math.round(baseDamage * (1 - enemy.armor / 100)));
    effectiveDamagePerHit = reduced;
    assumptions.push(`Mục tiêu có giáp ${enemy.armor}, giảm sát thương từ ${baseDamage} xuống ${effectiveDamagePerHit}`);
  }

  // 2. Sneak attack calculation
  const isSneak = !!params.isSneakAttack;
  const sneakMultiplier = isSneak ? stats.sneakMultiplier ?? (stats.isFirearm ? 1 : 3) : 1;
  const firstHitDamage = effectiveDamagePerHit * sneakMultiplier;

  if (isSneak && sneakMultiplier > 1) {
    assumptions.push(`Đòn đánh lén (sneak) đầu tiên nhân ${sneakMultiplier}x sát thương: ${firstHitDamage} dmg`);
  }

  // 3. Hits to kill
  let hitsToKill = 0;
  if (firstHitDamage >= enemy.hp) {
    hitsToKill = 1;
  } else {
    const remainingHp = enemy.hp - firstHitDamage;
    hitsToKill = 1 + Math.ceil(remainingHp / effectiveDamagePerHit);
  }

  // 4. Durability consumed
  const durabilityConsumedPerKill = hitsToKill * durabilityPerHit;
  const effectiveDurability = Math.floor((durabilityPercent / 100) * stats.durability);

  // 5. Enemies killable
  const enemiesKillable = durabilityConsumedPerKill > 0 ? Math.floor(effectiveDurability / durabilityConsumedPerKill) : 0;

  // 6. Time to kill & DPS
  const attackSpeed = stats.attackSpeed > 0 ? stats.attackSpeed : 1;
  const timeToKillSeconds = Number((hitsToKill / attackSpeed).toFixed(1));
  const dps = Number((effectiveDamagePerHit * attackSpeed).toFixed(1));

  assumptions.push(`Mỗi đòn đánh tiêu hao ${durabilityPerHit} đơn vị độ bền vũ khí.`);
  if (durabilityPercent < 100) {
    assumptions.push(`Tính theo độ bền còn lại: ${durabilityPercent}% (${effectiveDurability}/${stats.durability} hits).`);
  }

  return {
    isValid: true,
    missingFields: [],
    enemyName: enemy.name,
    weaponName: weapon.name,
    effectiveDamagePerHit,
    firstHitDamage,
    hitsToKill,
    durabilityConsumedPerKill,
    effectiveDurability,
    enemiesKillable,
    timeToKillSeconds,
    dps,
    assumptions,
  };
}

export function compareWeapons(enemy: Enemy, weapons: Item[], options: { isSneakAttack?: boolean } = {}): WeaponComparisonItem[] {
  const list: WeaponComparisonItem[] = [];

  for (const weapon of weapons) {
    if (!weapon.weaponStats) continue;
    const calc = calculateCombat({
      enemy,
      weapon,
      durabilityPercent: 100,
      isSneakAttack: options.isSneakAttack,
    });

    if (calc.isValid) {
      list.push({
        weaponId: weapon.id,
        weaponName: weapon.name,
        damage: weapon.weaponStats.damage,
        attackSpeed: weapon.weaponStats.attackSpeed,
        hitsToKill: calc.hitsToKill,
        durabilityConsumedPerKill: calc.durabilityConsumedPerKill,
        enemiesKillable: calc.enemiesKillable,
        timeToKillSeconds: calc.timeToKillSeconds,
        isFirearm: !!weapon.weaponStats.isFirearm,
      });
    }
  }

  // Sort by hits to kill (lowest first), then TTK
  return list.sort((a, b) => a.hitsToKill - b.hitsToKill || a.timeToKillSeconds - b.timeToKillSeconds);
}
