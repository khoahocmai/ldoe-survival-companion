import { Item, WeaponMod } from '../../types';

export interface ModdedWeaponResult {
  baseDamage: number;
  damage: number;
  damageDelta: number;

  baseAttackSpeed: number;
  attackSpeed: number;
  attackSpeedDelta: number;

  baseDurability: number;
  durability: number;
  durabilityDelta: number;

  baseDps: number;
  dps: number;
  dpsDelta: number;

  critChance: number;
  critDamage: number;
  stability: number;
  noise: number;
  range: number;

  activeSkills: string[];
}

export interface ModdedMaterialAggregate {
  itemId: string;
  itemName?: string;
  quantity: number;
}

function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function calculateModdedStats(weapon: Item, selectedMods: WeaponMod[]): ModdedWeaponResult {
  const baseStats = weapon.weaponStats ?? {
    damage: 0,
    attackSpeed: 1,
    durability: 0,
    range: 1,
    dps: 0,
  };

  const baseDamage = baseStats.damage;
  const baseAttackSpeed = baseStats.attackSpeed;
  const baseDurability = baseStats.durability;
  const baseDps = baseStats.dps ?? roundTo(baseDamage * baseAttackSpeed, 1);
  const baseRange = baseStats.range ?? 1;

  let damageBonus = 0;
  let speedBonus = 0;
  let durabilityBonus = 0;
  let critChance = 0;
  let critDamage = 0;
  let stability = 0;
  let noise = 0;
  let rangeBonus = 0;

  for (const mod of selectedMods) {
    if (!mod || !mod.stats) continue;
    if (typeof mod.stats.damage === 'number') damageBonus += mod.stats.damage;
    if (typeof mod.stats.attackSpeed === 'number') speedBonus += mod.stats.attackSpeed;
    if (typeof mod.stats.durability === 'number') durabilityBonus += mod.stats.durability;
    if (typeof mod.stats.critChance === 'number') critChance += mod.stats.critChance;
    if (typeof mod.stats.critDamage === 'number') critDamage += mod.stats.critDamage;
    if (typeof mod.stats.stability === 'number') stability += mod.stats.stability;
    if (typeof mod.stats.noise === 'number') noise += mod.stats.noise;
    if (typeof mod.stats.range === 'number') rangeBonus += mod.stats.range;
  }

  const finalDamage = Math.max(1, baseDamage + damageBonus);
  const finalAttackSpeed = roundTo(Math.max(0.1, baseAttackSpeed + speedBonus), 2);
  const finalDurability = Math.max(1, baseDurability + durabilityBonus);
  const finalDps = roundTo(finalDamage * finalAttackSpeed, 1);
  const finalRange = roundTo(baseRange + rangeBonus, 1);

  return {
    baseDamage,
    damage: finalDamage,
    damageDelta: damageBonus,

    baseAttackSpeed,
    attackSpeed: finalAttackSpeed,
    attackSpeedDelta: roundTo(speedBonus, 2),

    baseDurability,
    durability: finalDurability,
    durabilityDelta: durabilityBonus,

    baseDps,
    dps: finalDps,
    dpsDelta: roundTo(finalDps - baseDps, 1),

    critChance,
    critDamage,
    stability,
    noise,
    range: finalRange,

    activeSkills: extractActiveSkills(selectedMods),
  };
}

export function aggregateModMaterials(
  selectedMods: WeaponMod[],
  itemsMap?: Map<string, Item>
): ModdedMaterialAggregate[] {
  const map = new Map<string, number>();

  for (const mod of selectedMods) {
    if (!mod || !Array.isArray(mod.materials)) continue;
    for (const mat of mod.materials) {
      if (!mat.itemId || mat.quantity <= 0) continue;
      const current = map.get(mat.itemId) || 0;
      map.set(mat.itemId, current + mat.quantity);
    }
  }

  const result: ModdedMaterialAggregate[] = [];
  for (const [itemId, quantity] of map.entries()) {
    const item = itemsMap?.get(itemId);
    result.push({
      itemId,
      itemName: item?.name || itemId,
      quantity,
    });
  }

  return result.sort((a, b) => (a.itemName || a.itemId).localeCompare(b.itemName || b.itemId));
}

export function extractActiveSkills(selectedMods: WeaponMod[]): string[] {
  const skills: string[] = [];
  for (const mod of selectedMods) {
    if (mod && mod.activeSkill && mod.activeSkill.trim()) {
      skills.push(mod.activeSkill.trim());
    }
  }
  return skills;
}
