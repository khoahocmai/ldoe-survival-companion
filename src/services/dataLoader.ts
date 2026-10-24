import {
  Item,
  Enemy,
  Recipe,
  Location,
  Quest,
  LocationStructure,
  PointSystem,
  EnemyPointRule,
  GameDatabase,
} from '../types';
import { storageService } from './storageService';

export type DatabaseState = GameDatabase;

let cachedDb: GameDatabase | null = null;
let loadPromise: Promise<GameDatabase> | null = null;

// Validation helpers
function isValidEntity(e: any): boolean {
  return typeof e === 'object' && e !== null && typeof e.id === 'string' && e.id.trim() !== '';
}

export function clearDataCache() {
  cachedDb = null;
  loadPromise = null;
}

export async function loadGameData(forceRefresh = false): Promise<GameDatabase> {
  if (cachedDb && !forceRefresh) return cachedDb;
  if (loadPromise && !forceRefresh) return loadPromise;

  loadPromise = (async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

      const [
        itemsRes,
        enemiesRes,
        recipesRes,
        locationsRes,
        questsRes,
        structuresRes,
        pointSystemsRes,
        enemyPointRulesRes,
      ] = await Promise.all([
        fetch(`${cleanBase}data/items.json`),
        fetch(`${cleanBase}data/enemies.json`),
        fetch(`${cleanBase}data/recipes.json`),
        fetch(`${cleanBase}data/locations.json`),
        fetch(`${cleanBase}data/quests.json`),
        fetch(`${cleanBase}data/locationStructures.json`),
        fetch(`${cleanBase}data/pointSystems.json`),
        fetch(`${cleanBase}data/enemyPointRules.json`),
      ]);

      // A missing data file is a real failure: surface it instead of silently showing an empty wiki.
      const readJson = async <T,>(res: Response, file: string): Promise<T[]> => {
        if (!res.ok) throw new Error(`Không tải được data/${file} (HTTP ${res.status})`);
        const data = await res.json();
        return Array.isArray(data) ? (data as T[]) : [];
      };

      const baseItems = await readJson<Item>(itemsRes, 'items.json');
      const baseEnemies = await readJson<Enemy>(enemiesRes, 'enemies.json');
      const baseRecipes = await readJson<Recipe>(recipesRes, 'recipes.json');
      const baseLocations = await readJson<Location>(locationsRes, 'locations.json');
      const baseQuests = await readJson<Quest>(questsRes, 'quests.json');
      const baseStructures = await readJson<LocationStructure>(structuresRes, 'locationStructures.json');
      const basePointSystems = await readJson<PointSystem>(pointSystemsRes, 'pointSystems.json');
      const baseEnemyPointRules = await readJson<EnemyPointRule>(enemyPointRulesRes, 'enemyPointRules.json');

      // Load overrides from storage
      const overrides = storageService.getOverrides();
      const hiddenSet = new Set<string>(overrides.hiddenEntityIds || []);

      // Merge helper: Base + Custom/Edited, minus Hidden
      const mergeEntities = <T extends { id: string; isCustom?: boolean }>(
        baseList: T[],
        customList: T[]
      ): T[] => {
        const map = new Map<string, T>();
        for (const item of baseList) {
          if (isValidEntity(item) && !hiddenSet.has(item.id)) {
            map.set(item.id, item);
          }
        }
        for (const item of customList) {
          if (isValidEntity(item) && !hiddenSet.has(item.id)) {
            map.set(item.id, { ...item, isCustom: true });
          }
        }
        return Array.from(map.values());
      };

      const items = mergeEntities(baseItems, overrides.customItems);
      const enemies = mergeEntities(baseEnemies, overrides.customEnemies);
      const recipes = mergeEntities(baseRecipes, overrides.customRecipes);
      const locations = mergeEntities(baseLocations, overrides.customLocations);
      const quests = mergeEntities(baseQuests, overrides.customQuests);
      const locationStructures = mergeEntities(baseStructures, overrides.customLocationStructures);
      const pointSystems = mergeEntities(basePointSystems, overrides.customPointSystems);
      const enemyPointRules = mergeEntities(baseEnemyPointRules, overrides.customEnemyPointRules);

      // Maps for O(1) lookups
      const itemsMap = new Map<string, Item>(items.map((i) => [i.id, i]));
      const enemiesMap = new Map<string, Enemy>(enemies.map((e) => [e.id, e]));
      const recipesMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));
      const locationsMap = new Map<string, Location>(locations.map((l) => [l.id, l]));
      const questsMap = new Map<string, Quest>(quests.map((q) => [q.id, q]));
      const locationStructuresMap = new Map<string, LocationStructure>(locationStructures.map((s) => [s.id, s]));
      const pointSystemsMap = new Map<string, PointSystem>(pointSystems.map((p) => [p.id, p]));
      const enemyPointRulesMap = new Map<string, EnemyPointRule>(enemyPointRules.map((r) => [r.id, r]));

      const recipesByOutputMap = new Map<string, Recipe[]>();
      for (const recipe of recipes) {
        const list = recipesByOutputMap.get(recipe.outputItemId) || [];
        list.push(recipe);
        recipesByOutputMap.set(recipe.outputItemId, list);
      }

      cachedDb = {
        items,
        enemies,
        recipes,
        locations,
        quests,
        locationStructures,
        pointSystems,
        enemyPointRules,
        itemsMap,
        enemiesMap,
        recipesMap,
        recipesByOutputMap,
        locationsMap,
        questsMap,
        locationStructuresMap,
        pointSystemsMap,
        enemyPointRulesMap,
        isLoading: false,
        error: null,
      };

      return cachedDb;
    } catch (err: any) {
      console.error('Error loading game database:', err);
      const fallbackState: GameDatabase = {
        items: [],
        enemies: [],
        recipes: [],
        locations: [],
        quests: [],
        locationStructures: [],
        pointSystems: [],
        enemyPointRules: [],
        itemsMap: new Map(),
        enemiesMap: new Map(),
        recipesMap: new Map(),
        recipesByOutputMap: new Map(),
        locationsMap: new Map(),
        questsMap: new Map(),
        locationStructuresMap: new Map(),
        pointSystemsMap: new Map(),
        enemyPointRulesMap: new Map(),
        isLoading: false,
        error: err?.message || 'Lỗi khi tải dữ liệu game',
      };
      return fallbackState;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function getCachedGameData(): GameDatabase | null {
  return cachedDb;
}

// Check dependencies when an entity is requested to be deleted
export function checkEntityDependencies(
  type: 'item' | 'enemy' | 'recipe' | 'location' | 'quest' | 'structure' | 'pointSystem',
  id: string,
  db: GameDatabase
): { hasDependencies: boolean; dependents: string[] } {
  const dependents: string[] = [];

  if (type === 'item') {
    // Check recipes producing or requiring this item
    for (const r of db.recipes) {
      if (r.outputItemId === id) dependents.push(`Công thức tạo ra: ${r.id}`);
      if (r.ingredients.some((ing) => ing.itemId === id)) dependents.push(`Nguyên liệu trong công thức: ${r.id}`);
    }
    // Check location structures
    for (const s of db.locationStructures) {
      for (const stg of s.stages) {
        if (stg.requirements.some((req) => req.itemId === id)) {
          dependents.push(`Vật liệu công trình: ${s.name} (${stg.name})`);
        }
      }
    }
    // Check quests
    for (const q of db.quests) {
      if (q.objectives.some((obj) => obj.targetId === id)) {
        dependents.push(`Mục tiêu nhiệm vụ: ${q.title}`);
      }
      if (q.rewards.some((rew) => rew.itemId === id)) {
        dependents.push(`Phần thưởng nhiệm vụ: ${q.title}`);
      }
    }
  } else if (type === 'enemy') {
    // Check point rules
    for (const rule of db.enemyPointRules) {
      if (rule.enemyId === id) dependents.push(`Quy tắc điểm: ${rule.id}`);
    }
    // Check locations
    for (const loc of db.locations) {
      if (loc.enemies.includes(id)) dependents.push(`Xuất hiện tại địa điểm: ${loc.name}`);
    }
    // Check quests
    for (const q of db.quests) {
      if (q.objectives.some((obj) => obj.type === 'kill_enemy' && obj.targetId === id)) {
        dependents.push(`Mục tiêu tiêu diệt trong nhiệm vụ: ${q.title}`);
      }
    }
  } else if (type === 'location') {
    // Check structures
    for (const s of db.locationStructures) {
      if (s.locationId === id) dependents.push(`Công trình thuộc địa điểm này: ${s.name}`);
    }
    // Check quests
    for (const q of db.quests) {
      if (q.relatedLocations?.includes(id) || q.objectives.some((obj) => obj.targetId === id)) {
        dependents.push(`Nhiệm vụ liên quan: ${q.title}`);
      }
    }
  }

  return {
    hasDependencies: dependents.length > 0,
    dependents,
  };
}
