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
    itemId: 'leather',
    valuePerItem: 5,
    dailyLimit: 50,
    tier: 'caution',
    reason: 'Chế biến từ da thú thô trên giá thuộc da; thường dùng may giáp và mod vũ khí.',
  },
  {
    itemId: 'iron_plate',
    valuePerItem: 20,
    dailyLimit: 15,
    tier: 'recommended',
    reason: 'Dễ luyện từ quặng sắt thường, 15 tấm đổi được 300 EXP.',
  },
  {
    itemId: 'spring',
    valuePerItem: 20,
    dailyLimit: 10,
    tier: 'avoid',
    reason: 'Nguyên liệu cho các bản mod vũ khí.',
  },
  {
    itemId: 'engine_part',
    valuePerItem: 50,
    dailyLimit: 10,
    tier: 'avoid',
    reason: 'Dùng để đóng xe địa hình ATV, Bồn rửa axit và mod súng.',
  },
  {
    itemId: 'copper_bar',
    valuePerItem: 75,
    dailyLimit: 5,
    tier: 'avoid',
    reason: 'Nguyên liệu luyện Thép tấm (Steel Plate).',
  },
  {
    itemId: 'aluminium_plate',
    valuePerItem: 100,
    dailyLimit: 3,
    tier: 'avoid',
    reason: 'Nguyên liệu cho các bản mod súng.',
  },
  {
    itemId: 'chopper_wheel',
    valuePerItem: 500,
    dailyLimit: 1,
    tier: 'recommended',
    reason: 'Phụ tùng xe máy Chopper (+500 EXP).',
  },
  {
    itemId: 'chopper_fork',
    valuePerItem: 500,
    dailyLimit: 1,
    tier: 'recommended',
    reason: 'Phụ tùng xe máy Chopper (+500 EXP).',
  },
  {
    itemId: 'chopper_gas_tank',
    valuePerItem: 500,
    dailyLimit: 1,
    tier: 'recommended',
    reason: 'Phụ tùng xe máy Chopper (+500 EXP).',
  },
  {
    itemId: 'chopper_magazine',
    valuePerItem: 1000,
    tier: 'recommended',
    reason: 'Tạp chí xe máy cho +1,000 EXP tức thì không giới hạn lượt nộp.',
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

export interface ChopperDonationBreakdown {
  itemId: string;
  quantity: number;
  expGained: number;
  tier: 'recommended' | 'caution' | 'avoid';
}

export interface ChopperUpgradeResult {
  currentLevel: number;
  currentExp: number;
  requiredExpForCurrentLevel: number;
  totalExpGained: number;
  remainingExpToNextLevel: number;
  isLevelUpSatisfied: boolean;
  newLevel: number;
  newExp: number;
  requiredExpForNewLevel: number;
  levelsGained: number;
  perkRollsAvailable: number;
  isMaxLevel: boolean;
  donatedBreakdown: ChopperDonationBreakdown[];
}

export function calculateChopperUpgrade(params: ChopperUpgradeParams): ChopperUpgradeResult {
  const { currentLevel, currentExp, donations, acceptedItems = DEFAULT_CHOPPER_ACCEPTED_ITEMS } = params;

  const itemMap = new Map<string, StructureCycleItem>(acceptedItems.map((item) => [item.itemId, item]));

  let totalExpGained = 0;
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
  }

  const validCurrentLevel = Math.max(1, Math.min(100, currentLevel));
  const validCurrentExp = Math.max(0, currentExp);
  const requiredExpForCurrentLevel = getChopperRequiredExp(validCurrentLevel);

  // Check how much EXP is still needed to complete the current level
  const totalExpProgress = validCurrentExp + totalExpGained;
  const remainingExpToNextLevel = validCurrentLevel >= 100 ? 0 : Math.max(0, requiredExpForCurrentLevel - totalExpProgress);
  const isLevelUpSatisfied = validCurrentLevel < 100 && totalExpProgress >= requiredExpForCurrentLevel;

  // Level advancement simulation
  let level = validCurrentLevel;
  let exp = totalExpProgress;
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
    currentLevel: validCurrentLevel,
    currentExp: validCurrentExp,
    requiredExpForCurrentLevel,
    totalExpGained,
    remainingExpToNextLevel,
    isLevelUpSatisfied,
    newLevel: level,
    newExp: exp,
    requiredExpForNewLevel: getChopperRequiredExp(level),
    levelsGained,
    perkRollsAvailable: levelsGained,
    isMaxLevel,
    donatedBreakdown,
  };
}

/**
 * Returns a recommended combo of cheap and plentiful materials (Bolts, Bearings, Iron Plates, spare bike parts)
 * to maximize daily EXP for quick reference.
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
