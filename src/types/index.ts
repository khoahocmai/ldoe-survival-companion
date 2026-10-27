export type VerificationStatus = 'verified' | 'unverified' | 'custom';

export interface EntityMetadata {
  isCustom?: boolean;
  notes?: string;
  /** Optional screenshot path (relative to /public). Defaults to images/<kind>/<id>.png when omitted. */
  image?: string;
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
  | 'workstation'
  | 'furniture'
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
  buffEffect?: string;
  durationSeconds?: number;
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
  order?: number;
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
  category: 'zombie' | 'boss' | 'wildlife' | 'human' | 'machine';
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

export interface RecipeBuffStats {
  healHp?: number;
  hunger?: number;
  thirst?: number;
  buffEffect?: string;
  durationSeconds?: number;
}

export interface Recipe extends EntityMetadata {
  id: string;
  outputItemId: string;
  outputQuantity: number;
  ingredients: RecipeIngredient[];
  category?: 'crafting' | 'processing' | 'cooking';
  workstation?: string;
  craftTimeSeconds?: number;
  levelRequired?: number;
  isWorkbenchOnly?: boolean;
  buffStats?: RecipeBuffStats;
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

export type QuestObjectiveType =
  | 'kill_enemy'
  | 'earn_points'
  | 'collect_item'
  | 'craft_item'
  | 'visit_location'
  | 'repair_structure'
  | 'unlock_area'
  | 'interact'
  | 'other';

export interface QuestObjective {
  id: string;
  type: QuestObjectiveType;
  description: string;
  targetId?: string; // enemyId, itemId, locationId, structureId
  quantity?: number;
}

export interface QuestReward {
  itemId: string;
  quantity: number;
}

export interface Quest extends EntityMetadata {
  id: string;
  title: string;
  vietnameseTitle?: string;
  category: 'survivors_path' | 'story' | 'raiders' | 'daily' | 'event';
  chapter?: string;
  description: string;
  prerequisites?: string[];
  objectives: QuestObjective[];
  rewards: QuestReward[];
  relatedLocations?: string[];
  relatedEnemies?: string[];
  relatedItems?: string[];
  instructions?: string;
}

export interface LocationStructureStage {
  id: string;
  name: string;
  requirements: Array<{
    itemId: string;
    quantity: number;
  }>;
}

export type StructureFrequency = 'one_time' | 'recurring';

export interface StructureCycleItem {
  itemId: string;
  valuePerItem: number;
  dailyLimit?: number;
  tier: 'recommended' | 'caution' | 'avoid';
  reason?: string;
}

export interface StructureCyclePerk {
  name: string;
  tier: 'S' | 'A' | 'B' | 'C';
  description: string;
}

export interface StructureCycleConfig {
  resetHours: number;
  progressionType: 'vehicle_exp' | 'reputation' | 'trade';
  maxLevel?: number;
  acceptedItems: StructureCycleItem[];
  perkGuide?: StructureCyclePerk[];
}

export interface LocationStructure extends EntityMetadata {
  id: string;
  locationId: string;
  name: string;
  vietnameseName?: string;
  type: 'repair' | 'construction' | 'unlock' | 'upgrade' | 'delivery';
  frequency?: StructureFrequency;
  description?: string;
  stages: LocationStructureStage[];
  cycleConfig?: StructureCycleConfig;
  prerequisiteIds?: string[];
  unlocks?: string[];
}

export interface PointMilestone {
  id: string;
  name: string;
  points: number;
}

export interface PointSystem extends EntityMetadata {
  id: string;
  name: string;
  description?: string;
  unit: string;
  milestones: PointMilestone[];
}

export interface EnemyPointRule extends EntityMetadata {
  id: string;
  pointSystemId: string;
  enemyId: string;
  locationId?: string; // optional location-specific override
  points: number | null; // null if unknown
  notes?: string;
}

export interface ReferenceSource {
  id: string;
  name: string;
  url: string;
  description?: string;
}

export type WeaponModSlot = 'blade' | 'tip' | 'handle' | 'muzzle' | 'magazine' | 'sight' | 'grip' | 'stock';

export interface WeaponModStatBonus {
  damage?: number; // Sát thương cộng thêm (vd: +4)
  attackSpeed?: number; // Tốc đánh thay đổi (vd: +0.08 hoặc -0.05)
  critChance?: number; // Tỉ lệ chí mạng (vd: +10%)
  critDamage?: number; // Sát thương chí mạng (vd: +15%)
  durability?: number; // Độ bền cộng thêm (vd: +20 đòn)
  stability?: number; // Độ ổn định/giảm giật (cho súng)
  noise?: number; // Tăng/giảm độ ồn (cho súng/raiding)
  range?: number; // Tầm bắn
}

export interface WeaponMod extends EntityMetadata {
  id: string;
  weaponId: string;
  slot: WeaponModSlot;
  name: string;
  vietnameseName: string;
  rarity: 'common' | 'rare' | 'extremely_rare';
  stats: WeaponModStatBonus;
  activeSkill?: string;
  materials: { itemId: string; quantity: number }[];
  obtainDescription?: string;
  description?: string;
}

export interface WikiOverrides {
  customItems: Item[];
  customEnemies: Enemy[];
  customRecipes: Recipe[];
  customLocations: Location[];
  customQuests: Quest[];
  customLocationStructures: LocationStructure[];
  customPointSystems: PointSystem[];
  customEnemyPointRules: EnemyPointRule[];
  customWeaponMods: WeaponMod[];
  hiddenEntityIds: string[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'vi';
}

export interface AppStorageSchema {
  version: number;
  theme: 'light' | 'dark';
  settings: AppSettings;
  overrides: WikiOverrides;
  referenceSources: ReferenceSource[];
  legacyData?: any; // preserved previous user inventory, goals, notes
}

export interface GameDatabase {
  items: Item[];
  enemies: Enemy[];
  recipes: Recipe[];
  locations: Location[];
  quests: Quest[];
  locationStructures: LocationStructure[];
  pointSystems: PointSystem[];
  enemyPointRules: EnemyPointRule[];
  weaponMods: WeaponMod[];

  itemsMap: Map<string, Item>;
  enemiesMap: Map<string, Enemy>;
  recipesMap: Map<string, Recipe>;
  recipesByOutputMap: Map<string, Recipe[]>;
  locationsMap: Map<string, Location>;
  questsMap: Map<string, Quest>;
  locationStructuresMap: Map<string, LocationStructure>;
  pointSystemsMap: Map<string, PointSystem>;
  enemyPointRulesMap: Map<string, EnemyPointRule>;
  weaponModsMap: Map<string, WeaponMod>;
  weaponModsByWeaponIdMap: Map<string, WeaponMod[]>;

  isLoading: boolean;
  error: string | null;
}
