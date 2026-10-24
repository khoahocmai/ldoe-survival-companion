import { Item, Enemy, Recipe, Location, Quest } from '../types';

export interface DatabaseState {
  items: Item[];
  enemies: Enemy[];
  recipes: Recipe[];
  locations: Location[];
  quests: Quest[];
  itemsMap: Map<string, Item>;
  enemiesMap: Map<string, Enemy>;
  recipesMap: Map<string, Recipe>;
  recipesByOutputMap: Map<string, Recipe[]>;
  locationsMap: Map<string, Location>;
  questsMap: Map<string, Quest>;
  isLoading: boolean;
  error: string | null;
}

let cachedDb: DatabaseState | null = null;
let loadPromise: Promise<DatabaseState> | null = null;

// Safe parser to ensure entities conform to minimum requirements without crashing
function validateItem(item: any): item is Item {
  return typeof item === 'object' && item !== null && typeof item.id === 'string' && typeof item.name === 'string';
}

function validateEnemy(enemy: any): enemy is Enemy {
  return typeof enemy === 'object' && enemy !== null && typeof enemy.id === 'string' && typeof enemy.name === 'string';
}

function validateRecipe(recipe: any): recipe is Recipe {
  return typeof recipe === 'object' && recipe !== null && typeof recipe.id === 'string' && typeof recipe.outputItemId === 'string' && Array.isArray(recipe.ingredients);
}

function validateLocation(loc: any): loc is Location {
  return typeof loc === 'object' && loc !== null && typeof loc.id === 'string' && typeof loc.name === 'string';
}

function validateQuest(quest: any): quest is Quest {
  return typeof quest === 'object' && quest !== null && typeof quest.id === 'string' && typeof quest.title === 'string' && Array.isArray(quest.steps);
}

export async function loadGameData(): Promise<DatabaseState> {
  if (cachedDb) return cachedDb;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

      const [itemsRes, enemiesRes, recipesRes, locationsRes, questsRes] = await Promise.all([
        fetch(`${cleanBase}data/items.json`),
        fetch(`${cleanBase}data/enemies.json`),
        fetch(`${cleanBase}data/recipes.json`),
        fetch(`${cleanBase}data/locations.json`),
        fetch(`${cleanBase}data/quests.json`),
      ]);

      if (!itemsRes.ok) throw new Error(`Không thể tải items.json: ${itemsRes.status}`);
      if (!enemiesRes.ok) throw new Error(`Không thể tải enemies.json: ${enemiesRes.status}`);
      if (!recipesRes.ok) throw new Error(`Không thể tải recipes.json: ${recipesRes.status}`);
      if (!locationsRes.ok) throw new Error(`Không thể tải locations.json: ${locationsRes.status}`);
      if (!questsRes.ok) throw new Error(`Không thể tải quests.json: ${questsRes.status}`);

      const rawItems = await itemsRes.json();
      const rawEnemies = await enemiesRes.json();
      const rawRecipes = await recipesRes.json();
      const rawLocations = await locationsRes.json();
      const rawQuests = await questsRes.json();

      const items: Item[] = Array.isArray(rawItems) ? rawItems.filter(validateItem) : [];
      const enemies: Enemy[] = Array.isArray(rawEnemies) ? rawEnemies.filter(validateEnemy) : [];
      const recipes: Recipe[] = Array.isArray(rawRecipes) ? rawRecipes.filter(validateRecipe) : [];
      const locations: Location[] = Array.isArray(rawLocations) ? rawLocations.filter(validateLocation) : [];
      const quests: Quest[] = Array.isArray(rawQuests) ? rawQuests.filter(validateQuest) : [];

      const itemsMap = new Map<string, Item>(items.map((i) => [i.id, i]));
      const enemiesMap = new Map<string, Enemy>(enemies.map((e) => [e.id, e]));
      const recipesMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));
      const locationsMap = new Map<string, Location>(locations.map((l) => [l.id, l]));
      const questsMap = new Map<string, Quest>(quests.map((q) => [q.id, q]));

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
        itemsMap,
        enemiesMap,
        recipesMap,
        recipesByOutputMap,
        locationsMap,
        questsMap,
        isLoading: false,
        error: null,
      };

      return cachedDb;
    } catch (err: any) {
      console.error('Error loading game database:', err);
      const fallbackState: DatabaseState = {
        items: [],
        enemies: [],
        recipes: [],
        locations: [],
        quests: [],
        itemsMap: new Map(),
        enemiesMap: new Map(),
        recipesMap: new Map(),
        recipesByOutputMap: new Map(),
        locationsMap: new Map(),
        questsMap: new Map(),
        isLoading: false,
        error: err?.message || 'Lỗi không xác định khi tải dữ liệu game',
      };
      return fallbackState;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function getCachedGameData(): DatabaseState | null {
  return cachedDb;
}
