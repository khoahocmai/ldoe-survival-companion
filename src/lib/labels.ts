import { Enemy, Item, ItemCategory, Location, Quest, QuestObjectiveType, WeaponModSlot, WeaponMod } from '../types';
import type { Tone } from '../components/common/Badge';

export const WEAPON_MOD_SLOT_LABEL: Record<WeaponModSlot, string> = {
  blade: 'Lưỡi dao',
  tip: 'Mũi giáo / Đầu nhọn',
  handle: 'Tay cầm',
  muzzle: 'Đầu nòng',
  magazine: 'Băng đạn',
  sight: 'Kính ngắm',
  grip: 'Tay nắm',
  stock: 'Báng súng',
};

export const WEAPON_MOD_RARITY_LABEL: Record<WeaponMod['rarity'], string> = {
  common: 'Thường (Trắng)',
  rare: 'Hiếm (Xanh)',
  extremely_rare: 'Cực hiếm (Tím)',
};

export const WEAPON_MOD_RARITY_TONE: Record<WeaponMod['rarity'], Tone> = {
  common: 'neutral',
  rare: 'info',
  extremely_rare: 'accent',
};

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  weapon_melee: 'Cận chiến',
  weapon_firearm: 'Súng',
  armor_head: 'Mũ bảo hộ',
  armor_chest: 'Áo giáp',
  armor_legs: 'Quần giáp',
  armor_feet: 'Giày',
  resource_raw: 'Nguyên liệu thô',
  resource_processed: 'Nguyên liệu chế biến',
  medical: 'Y tế',
  food: 'Thực phẩm',
  tool: 'Dụng cụ',
  workstation: 'Bàn chế tạo',
  furniture: 'Nội thất & Bẫy',
  component: 'Linh kiện',
  special: 'Đặc biệt',
};

export const RARITY_LABEL: Record<Item['rarity'], string> = {
  common: 'Thường',
  rare: 'Hiếm',
  epic: 'Sử thi',
  legendary: 'Huyền thoại',
};

export const RARITY_TONE: Record<Item['rarity'], Tone> = {
  common: 'neutral',
  rare: 'ok',
  epic: 'info',
  legendary: 'accent',
};

export const ENEMY_CATEGORY_LABEL: Record<Enemy['category'], string> = {
  zombie: 'Zombie',
  boss: 'Boss',
  wildlife: 'Động vật hoang dã',
  human: 'Con người',
};

export const MOVEMENT_LABEL: Record<NonNullable<Enemy['movementSpeed']>, string> = {
  slow: 'Chậm',
  normal: 'Bình thường',
  fast: 'Nhanh',
  very_fast: 'Rất nhanh',
};

export const LOCATION_DIFFICULTY_LABEL: Record<Location['difficulty'], string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
  bunker: 'Bunker',
  event: 'Sự kiện',
};

export const LOCATION_DIFFICULTY_TONE: Record<Location['difficulty'], Tone> = {
  easy: 'ok',
  medium: 'warn',
  hard: 'danger',
  bunker: 'info',
  event: 'accent',
};

export const QUEST_CATEGORY_LABEL: Record<Quest['category'], string> = {
  survivors_path: "Survivor's Path",
  story: 'Cốt truyện',
  raiders: 'Raiders',
  daily: 'Hằng ngày',
  event: 'Sự kiện',
};

export const OBJECTIVE_TYPE_LABEL: Record<QuestObjectiveType, string> = {
  kill_enemy: 'Tiêu diệt',
  earn_points: 'Kiếm điểm',
  collect_item: 'Thu thập',
  craft_item: 'Chế tạo',
  visit_location: 'Đến địa điểm',
  repair_structure: 'Sửa công trình',
  unlock_area: 'Mở khóa khu vực',
  interact: 'Tương tác',
  other: 'Khác',
};

export const RECIPE_CATEGORY_LABEL = {
  crafting: 'Chế tạo',
  processing: 'Chế biến',
  cooking: 'Nấu ăn',
} as const;

/** Danger rating (1-5) as a tone: more skulls, more red. */
export function dangerTone(level: number): Tone {
  if (level >= 4) return 'danger';
  if (level === 3) return 'warn';
  return 'ok';
}
