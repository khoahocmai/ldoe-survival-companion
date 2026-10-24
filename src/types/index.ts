export type VerificationStatus = 'verified' | 'unverified' | 'demo';

export interface EntityMetadata {
  source?: string;
  verifiedAt?: string;
  gameVersion?: string;
  verificationStatus: VerificationStatus;
}

export type ItemCategory =
  | 'weapon_melee'
  | 'weapon_firearm'
  | 'armor_head'
  | 'armor_chest'
  | 'armor_legs'
  | 'armor_feet'
  | 'resource_raw'
  | 'resource_processed'
  | 'medical'
  | 'food'
  | 'tool'
  | 'component'
  | 'special';

export interface WeaponStats {
  damage: number;
  attackSpeed: number; // attacks per second
  durability: number; // max hit count
  range?: number;
  sneakMultiplier?: number; // usually 3x for melee, 1x for firearms
  isFirearm?: boolean;
  dps?: number;
}

export interface ArmorStats {
  armorValue: number;
  durability: number;
  slot: 'head' | 'chest' | 'legs' | 'feet';
}

export interface ConsumableStats {
  healHp?: number;
  hunger?: number;
  thirst?: number;
}

export interface Item extends EntityMetadata {
  id: string;
  name: string;
  vietnameseName?: string;
  description: string;
  category: ItemCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stackSize: number;
  icon?: string;
  weaponStats?: WeaponStats;
  armorStats?: ArmorStats;
  consumableStats?: ConsumableStats;
  obtainLocations?: string[]; // location IDs
  craftable?: boolean;
}

export interface EnemyDrop {
  itemId: string;
  chance?: string;
  quantity?: string;
}

export interface Enemy extends EntityMetadata {
  id: string;
  name: string;
  vietnameseName?: string;
  category: 'zombie' | 'boss' | 'wildlife' | 'human';
  hp: number;
  damage: number;
  armor: number; // flat or percentage
  attackSpeed?: number;
  movementSpeed?: 'slow' | 'normal' | 'fast' | 'very_fast';
  abilities?: string[];
  drops: EnemyDrop[];
  locations: string[]; // location IDs
  dangerRating: 1 | 2 | 3 | 4 | 5;
  description: string;
  combatTips?: string[];
}

export interface RecipeIngredient {
  itemId: string;
  quantity: number;
}

export interface Recipe extends EntityMetadata {
  id: string;
  outputItemId: string;
  outputQuantity: number;
  ingredients: RecipeIngredient[];
  workstation?: string;
  craftTimeSeconds?: number;
  levelRequired?: number;
  isWorkbenchOnly?: boolean;
}

export interface Location extends EntityMetadata {
  id: string;
  name: string;
  vietnameseName?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'bunker' | 'event';
  dangerLevel: number; // 1 - 5 skulls
  description: string;
  enemies: string[]; // Enemy IDs
  resources: string[]; // Item IDs
  loot: string[]; // Item IDs
  energyCost?: number;
  resetTimeHours?: number;
  requiresChopper?: boolean;
  notes?: string;
}

export interface QuestStep {
  id: string;
  text: string;
  vietnameseText?: string;
  requiredItemId?: string;
  requiredQuantity?: number;
}

export interface QuestReward {
  itemId: string;
  quantity: number;
}

export interface Quest extends EntityMetadata {
  id: string;
  title: string;
  vietnameseTitle?: string;
  category: 'survivors_path' | 'story' | 'raiders' | 'daily';
  chapter?: string;
  description: string;
  prerequisites?: string[];
  steps: QuestStep[];
  rewards: QuestReward[];
}

// User / Personal Progress Storage Types
export interface WeaponInstance {
  id: string;
  itemId: string;
  durabilityPercent: number; // 0 - 100%
  customDamage?: number;
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetItemId: string;
  targetQuantity: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  linkedEntity?: {
    type: 'item' | 'enemy' | 'recipe' | 'location' | 'quest';
    id: string;
    name?: string;
  };
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  type: 'item' | 'enemy' | 'recipe' | 'location' | 'quest';
  id: string;
  addedAt: string;
}

export interface QuestUserProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completedStepIds: string[];
  updatedAt: string;
}

export interface UserDataSchema {
  version: number;
  inventory: Record<string, number>; // itemId -> count
  weaponInstances: WeaponInstance[];
  questProgress: Record<string, QuestUserProgress>; // questId -> progress
  goals: Goal[];
  notes: UserNote[];
  favorites: FavoriteItem[];
  recentlyViewed: Array<{ type: 'item' | 'enemy' | 'recipe' | 'location' | 'quest'; id: string; timestamp: number }>;
  settings: {
    language: 'vi';
    compactView: boolean;
  };
}

// Global Game Database Cache Interface
export interface GameDatabase {
  items: Map<string, Item>;
  enemies: Map<string, Enemy>;
  recipes: Map<string, Recipe>;
  locations: Map<string, Location>;
  quests: Map<string, Quest>;
}
