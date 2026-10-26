import { StructureCycleItem } from '../../types';

export const DEFAULT_CHOPPER_ACCEPTED_ITEMS: StructureCycleItem[] = [
  {
    itemId: 'bolt',
    valuePerItem: 3,
    dailyLimit: 100,
    tier: 'recommended',
    reason: 'Rất dồi dào khi đi farm, Bunker Alfa và tái chế rác.',
  },
  {
    itemId: 'ball_bearing',
    valuePerItem: 5,
    dailyLimit: 50,
    tier: 'recommended',
    reason: 'Dễ kiếm số lượng lớn từ tái chế bóng đèn, ổ đĩa và rương đồ.',
  },
  {
    itemId: 'thick_leather',
    valuePerItem: 5,
    dailyLimit: 50,
    tier: 'caution',
    reason: 'Tốn công sấy da thú; nên ưu tiên may giáp SWAT/Tactical hoặc mod súng trước.',
  },
  {
    itemId: 'iron_plate',
    valuePerItem: 20,
    dailyLimit: 15,
    tier: 'recommended',
    reason: 'Dễ luyện từ quặng sắt thường, 15 tấm đổi được 300 EXP rất hời.',
  },
  {
    itemId: 'spring',
    valuePerItem: 20,
    dailyLimit: 10,
    tier: 'avoid',
    reason: 'Nguyên liệu mod vũ khí quý hiếm, không nên hiến cho thợ xe.',
  },
  {
    itemId: 'engine_part',
    valuePerItem: 50,
    dailyLimit: 10,
    tier: 'avoid',
    reason: 'Vô cùng quan trọng để đóng xe địa hình ATV, Bồn rửa axit và mod súng.',
  },
  {
    itemId: 'copper_bar',
    valuePerItem: 75,
    dailyLimit: 5,
    tier: 'avoid',
    reason: 'Nguyên liệu luyện Thép tấm (Steel Plate), cực kỳ tốn công khai thác tuyết.',
  },
  {
    itemId: 'aluminium_plate',
    valuePerItem: 100,
    dailyLimit: 3,
    tier: 'avoid',
    reason: 'Nguyên liệu thiết yếu để chế tạo mod súng cao cấp.',
  },
  {
    itemId: 'chopper_wheel',
    valuePerItem: 500,
    dailyLimit: 1,
    tier: 'recommended',
    reason: 'Phụ tùng thừa sau khi đã ráp xong Chopper, nộp được tới +500 EXP.',
  },
  {
    itemId: 'chopper_fork',
    valuePerItem: 500,
    dailyLimit: 1,
    tier: 'recommended',
    reason: 'Phụ tùng thừa sau khi đã ráp xong Chopper, nộp được tới +500 EXP.',
  },
  {
    itemId: 'chopper_gas_tank',
    valuePerItem: 500,
    dailyLimit: 1,
    tier: 'recommended',
    reason: 'Phụ tùng thừa sau khi đã ráp xong Chopper, nộp được tới +500 EXP.',
  },
  {
    itemId: 'chopper_magazine',
    valuePerItem: 1000,
    tier: 'recommended',
    reason: 'Tạp chí hướng dẫn cho ngay +1,000 EXP tức thì không giới hạn lượt nộp.',
  },
];

/**
 * Returns required EXP to advance from `level` to `level + 1`.
 * In LDoE, Level 1 requires 1500 EXP, Level 42 requires 4500 EXP, and Level 100 is max cap.
 */
export function getChopperRequiredExp(level: number): number {
  if (level >= 100) return 0;
  if (level < 1) return 1500;
  // Exact match: 1500 + 41 * 73.1707317... = 4500 at level 42
  return Math.round(1500 + (level - 1) * (3000 / 41));
}

export interface ChopperUpgradeParams {
  currentLevel: number;
  currentExp: number;
  donations: Record<string, number>;
  acceptedItems?: StructureCycleItem[];
}

export interface ChopperWarning {
  itemId: string;
  message: string;
  severity: 'danger' | 'warning';
}

export interface ChopperDonationBreakdown {
  itemId: string;
  quantity: number;
  expGained: number;
  tier: 'recommended' | 'caution' | 'avoid';
}

export interface ChopperUpgradeResult {
  currentLevel: number;
  currentExp: number;
  totalExpGained: number;
  newLevel: number;
  newExp: number;
  requiredExpForNewLevel: number;
  levelsGained: number;
  perkRollsAvailable: number;
  isMaxLevel: boolean;
  warnings: ChopperWarning[];
  donatedBreakdown: ChopperDonationBreakdown[];
}

export function calculateChopperUpgrade(params: ChopperUpgradeParams): ChopperUpgradeResult {
  const { currentLevel, currentExp, donations, acceptedItems = DEFAULT_CHOPPER_ACCEPTED_ITEMS } = params;

  const itemMap = new Map<string, StructureCycleItem>(acceptedItems.map((item) => [item.itemId, item]));

  let totalExpGained = 0;
  const warnings: ChopperWarning[] = [];
  const donatedBreakdown: ChopperDonationBreakdown[] = [];

  for (const [itemId, quantity] of Object.entries(donations)) {
    if (!quantity || quantity <= 0) continue;
    const config = itemMap.get(itemId);
    if (!config) continue;

    const expGained = quantity * config.valuePerItem;
    totalExpGained += expGained;

    donatedBreakdown.push({
      itemId,
      quantity,
      expGained,
      tier: config.tier,
    });

    if (config.tier === 'avoid') {
      warnings.push({
        itemId,
        message: config.reason || `Vật phẩm ${itemId} rất quý hiếm, không nên hiến tặng cho Jane!`,
        severity: 'danger',
      });
    } else if (config.tier === 'caution') {
      warnings.push({
        itemId,
        message: config.reason || `Vật phẩm ${itemId} cần cân nhắc trước khi nộp.`,
        severity: 'warning',
      });
    }
  }

  // Level advancement loop
  let level = Math.max(1, Math.min(100, currentLevel));
  let exp = Math.max(0, currentExp) + totalExpGained;
  let levelsGained = 0;

  while (level < 100) {
    const required = getChopperRequiredExp(level);
    if (exp >= required) {
      exp -= required;
      level += 1;
      levelsGained += 1;
    } else {
      break;
    }
  }

  const isMaxLevel = level >= 100;
  if (isMaxLevel) {
    exp = 0;
  }

  return {
    currentLevel,
    currentExp,
    totalExpGained,
    newLevel: level,
    newExp: exp,
    requiredExpForNewLevel: getChopperRequiredExp(level),
    levelsGained,
    perkRollsAvailable: levelsGained,
    isMaxLevel,
    warnings,
    donatedBreakdown,
  };
}

/**
 * Returns a recommended turn-in combo of cheap junk materials (Bolts, Bearings, Iron Plates, spare bike parts)
 * to maximize daily EXP without sacrificing rare mod materials.
 */
export function getOptimalJunkCombo(acceptedItems: StructureCycleItem[] = DEFAULT_CHOPPER_ACCEPTED_ITEMS): Record<string, number> {
  const combo: Record<string, number> = {};

  for (const item of acceptedItems) {
    if (item.tier === 'recommended' && item.dailyLimit && item.dailyLimit > 0) {
      combo[item.itemId] = item.dailyLimit;
    }
  }

  return combo;
}
