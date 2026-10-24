import {
  AppStorageSchema,
  WikiOverrides,
  ReferenceSource,
  Item,
  Enemy,
  Recipe,
  Location,
  Quest,
  LocationStructure,
  PointSystem,
  EnemyPointRule,
} from '../types';

const STORAGE_KEY = 'ldoe_companion_wiki_storage_v2';
const LEGACY_STORAGE_KEY = 'ldoe_companion_personal_data_v1';

export const INITIAL_REFERENCE_SOURCES: ReferenceSource[] = [
  {
    id: 'kefir_devblog',
    name: 'Kefir Devblog — Last Day on Earth',
    url: 'https://kefirgames.com/dev-blog/last-day-on-earth',
    description: 'Thông báo chính thức từ nhà phát triển về các bản cập nhật, sự kiện và thay đổi cơ chế game.',
  },
  {
    id: 'kefir_helpshift',
    name: 'Kefir Help Center & FAQ',
    url: 'https://kefirgames.helpshift.com/hc/en/5-last-day-on-earth/',
    description: 'Trung tâm trợ giúp và tài liệu chính thức từ Kefir về vật phẩm, tài khoản và quy tắc chơi.',
  },
  {
    id: 'ldoe_fandom_wiki',
    name: 'Last Day on Earth: Survival Wiki (Fandom)',
    url: 'https://last-day-on-earth-survival.fandom.com/wiki/Last_Day_on_Earth:_Survival_Wiki',
    description: 'Bách khoa toàn thư cộng đồng đầy đủ nhất về thông số vũ khí, quái vật, công thức và địa điểm.',
  },
];

export const EMPTY_OVERRIDES: WikiOverrides = {
  customItems: [],
  customEnemies: [],
  customRecipes: [],
  customLocations: [],
  customQuests: [],
  customLocationStructures: [],
  customPointSystems: [],
  customEnemyPointRules: [],
  customWeaponMods: [],
  hiddenEntityIds: [],
};

export function notifyDataChange(reason: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ldoe_data_change', { detail: { reason } }));
  }
}

class StorageService {
  private cache: AppStorageSchema | null = null;

  public load(): AppStorageSchema {
    if (this.cache) return this.cache;

    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      let legacyData: any = undefined;

      // Safely check for previous personal data from older session to preserve it
      try {
        const legacyRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(LEGACY_STORAGE_KEY) : null;
        if (legacyRaw) {
          legacyData = JSON.parse(legacyRaw);
        }
      } catch {}

      if (!raw) {
        this.cache = {
          version: 2,
          theme: 'dark',
          settings: { theme: 'dark', language: 'vi' },
          overrides: { ...EMPTY_OVERRIDES },
          referenceSources: [...INITIAL_REFERENCE_SOURCES],
          legacyData,
        };
        this.save(this.cache, false);
        return this.cache;
      }

      const parsed = JSON.parse(raw);
      this.cache = {
        version: 2,
        theme: parsed.theme || 'dark',
        settings: parsed.settings || { theme: 'dark', language: 'vi' },
        overrides: {
          customItems: Array.isArray(parsed.overrides?.customItems) ? parsed.overrides.customItems : [],
          customEnemies: Array.isArray(parsed.overrides?.customEnemies) ? parsed.overrides.customEnemies : [],
          customRecipes: Array.isArray(parsed.overrides?.customRecipes) ? parsed.overrides.customRecipes : [],
          customLocations: Array.isArray(parsed.overrides?.customLocations) ? parsed.overrides.customLocations : [],
          customQuests: Array.isArray(parsed.overrides?.customQuests) ? parsed.overrides.customQuests : [],
          customLocationStructures: Array.isArray(parsed.overrides?.customLocationStructures) ? parsed.overrides.customLocationStructures : [],
          customPointSystems: Array.isArray(parsed.overrides?.customPointSystems) ? parsed.overrides.customPointSystems : [],
          customEnemyPointRules: Array.isArray(parsed.overrides?.customEnemyPointRules) ? parsed.overrides.customEnemyPointRules : [],
          customWeaponMods: Array.isArray(parsed.overrides?.customWeaponMods) ? parsed.overrides.customWeaponMods : [],
          hiddenEntityIds: Array.isArray(parsed.overrides?.hiddenEntityIds) ? parsed.overrides.hiddenEntityIds : [],
        },
        referenceSources: Array.isArray(parsed.referenceSources) && parsed.referenceSources.length > 0
          ? parsed.referenceSources
          : [...INITIAL_REFERENCE_SOURCES],
        legacyData: parsed.legacyData || legacyData,
      };

      return this.cache;
    } catch (err) {
      console.warn('Lỗi đọc storage, khởi tạo giá trị an toàn:', err);
      this.cache = {
        version: 2,
        theme: 'dark',
        settings: { theme: 'dark', language: 'vi' },
        overrides: { ...EMPTY_OVERRIDES },
        referenceSources: [...INITIAL_REFERENCE_SOURCES],
      };
      return this.cache;
    }
  }

  public save(data: AppStorageSchema, notify = true): void {
    try {
      this.cache = data;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      if (notify) {
        notifyDataChange('save');
      }
    } catch (err) {
      console.error('Lỗi khi ghi vào localStorage:', err);
    }
  }

  public getOverrides(): WikiOverrides {
    return this.load().overrides;
  }

  // Generic Save / Update for any entity type
  public saveEntity<T extends { id: string }>(
    entityType: keyof Omit<WikiOverrides, 'hiddenEntityIds'>,
    entity: T
  ): void {
    const data = this.load();
    const list = [...(data.overrides[entityType] as any[])];
    const index = list.findIndex((item) => item.id === entity.id);

    if (index >= 0) {
      list[index] = { ...entity, isCustom: true };
    } else {
      list.push({ ...entity, isCustom: true });
    }

    // Also unhide if previously hidden
    const hiddenEntityIds = data.overrides.hiddenEntityIds.filter((id) => id !== entity.id);

    this.save({
      ...data,
      overrides: {
        ...data.overrides,
        [entityType]: list,
        hiddenEntityIds,
      },
    });
  }

  // Generic Delete / Hide
  public deleteOrHideEntity(
    entityType: keyof Omit<WikiOverrides, 'hiddenEntityIds'>,
    id: string
  ): void {
    const data = this.load();
    const list = (data.overrides[entityType] as any[]).filter((item) => item.id !== id);
    const hiddenEntityIds = data.overrides.hiddenEntityIds.includes(id)
      ? data.overrides.hiddenEntityIds
      : [...data.overrides.hiddenEntityIds, id];

    this.save({
      ...data,
      overrides: {
        ...data.overrides,
        [entityType]: list,
        hiddenEntityIds,
      },
    });
  }

  // Unhide entity
  public unhideEntity(id: string): void {
    const data = this.load();
    const hiddenEntityIds = data.overrides.hiddenEntityIds.filter((item) => item !== id);
    this.save({
      ...data,
      overrides: {
        ...data.overrides,
        hiddenEntityIds,
      },
    });
  }

  // Sources & References CRUD
  public getReferenceSources(): ReferenceSource[] {
    return this.load().referenceSources;
  }

  public saveReferenceSource(source: ReferenceSource): void {
    const data = this.load();
    const list = [...data.referenceSources];
    const index = list.findIndex((s) => s.id === source.id);
    if (index >= 0) {
      list[index] = source;
    } else {
      list.push(source);
    }
    this.save({ ...data, referenceSources: list });
  }

  public deleteReferenceSource(id: string): void {
    const data = this.load();
    const list = data.referenceSources.filter((s) => s.id !== id);
    this.save({ ...data, referenceSources: list });
  }

  // Reset overrides back to base static JSON
  public resetOverrides(): void {
    const data = this.load();
    this.save({
      ...data,
      overrides: { ...EMPTY_OVERRIDES },
    });
  }

  // Export full merged dataset
  public exportMergedWikiData(mergedData: any): string {
    const payload = {
      app: 'LDoE Survival Companion - Game Encyclopedia',
      exportedAt: new Date().toISOString(),
      schemaVersion: 2,
      data: mergedData,
    };
    return JSON.stringify(payload, null, 2);
  }

  // Export legacy personal data if present
  public exportLegacyPersonalData(): string | null {
    const data = this.load();
    if (!data.legacyData) return null;
    return JSON.stringify(
      {
        app: 'LDoE Survival Companion - Legacy Personal Progress Backup',
        exportedAt: new Date().toISOString(),
        legacyData: data.legacyData,
      },
      null,
      2
    );
  }

  // Validate and import dataset
  public validateAndImportWiki(jsonString: string): {
    valid: boolean;
    preview?: {
      itemCount: number;
      enemyCount: number;
      recipeCount: number;
      locationCount: number;
      questCount: number;
      structureCount: number;
      pointSystemCount: number;
      enemyPointRuleCount: number;
      exportedAt?: string;
    };
    parsedData?: any;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Tệp không phải định dạng JSON hợp lệ.' };
      }

      const rawData = parsed.data || parsed;
      if (!rawData || typeof rawData !== 'object') {
        return { valid: false, error: 'Không tìm thấy dữ liệu Encyclopedia trong tệp.' };
      }

      const items = Array.isArray(rawData.items) ? rawData.items : [];
      const enemies = Array.isArray(rawData.enemies) ? rawData.enemies : [];
      const recipes = Array.isArray(rawData.recipes) ? rawData.recipes : [];
      const locations = Array.isArray(rawData.locations) ? rawData.locations : [];
      const quests = Array.isArray(rawData.quests) ? rawData.quests : [];
      const structures = Array.isArray(rawData.locationStructures) ? rawData.locationStructures : [];
      const pointSystems = Array.isArray(rawData.pointSystems) ? rawData.pointSystems : [];
      const enemyPointRules = Array.isArray(rawData.enemyPointRules) ? rawData.enemyPointRules : [];

      const total =
        items.length + enemies.length + recipes.length + locations.length + quests.length +
        structures.length + pointSystems.length + enemyPointRules.length;
      if (total === 0) {
        return { valid: false, error: 'Tệp không chứa thực thể nào (items, enemies, recipes...).' };
      }

      return {
        valid: true,
        preview: {
          enemyPointRuleCount: enemyPointRules.length,
          itemCount: items.length,
          enemyCount: enemies.length,
          recipeCount: recipes.length,
          locationCount: locations.length,
          questCount: quests.length,
          structureCount: structures.length,
          pointSystemCount: pointSystems.length,
          exportedAt: parsed.exportedAt,
        },
        parsedData: rawData,
      };
    } catch (err: any) {
      return { valid: false, error: `Lỗi đọc tệp JSON: ${err?.message || 'Không xác định'}` };
    }
  }

  // Apply imported dataset as custom overrides
  public applyImportedOverrides(importedData: any, mode: 'merge' | 'replace'): void {
    const data = this.load();
    const base = mode === 'replace' ? { ...EMPTY_OVERRIDES } : { ...data.overrides };

    const mergeList = (existing: any[], incoming: any[]) => {
      const map = new Map<string, any>(existing.map((e) => [e.id, e]));
      for (const item of incoming) {
        if (item && item.id) {
          map.set(item.id, { ...item, isCustom: true });
        }
      }
      return Array.from(map.values());
    };

    const newOverrides: WikiOverrides = {
      customItems: mergeList(base.customItems, Array.isArray(importedData.items) ? importedData.items : []),
      customEnemies: mergeList(base.customEnemies, Array.isArray(importedData.enemies) ? importedData.enemies : []),
      customRecipes: mergeList(base.customRecipes, Array.isArray(importedData.recipes) ? importedData.recipes : []),
      customLocations: mergeList(base.customLocations, Array.isArray(importedData.locations) ? importedData.locations : []),
      customQuests: mergeList(base.customQuests, Array.isArray(importedData.quests) ? importedData.quests : []),
      customLocationStructures: mergeList(base.customLocationStructures, Array.isArray(importedData.locationStructures) ? importedData.locationStructures : []),
      customPointSystems: mergeList(base.customPointSystems, Array.isArray(importedData.pointSystems) ? importedData.pointSystems : []),
      customEnemyPointRules: mergeList(base.customEnemyPointRules, Array.isArray(importedData.enemyPointRules) ? importedData.enemyPointRules : []),
      customWeaponMods: mergeList(base.customWeaponMods, Array.isArray(importedData.weaponMods) ? importedData.weaponMods : []),
      hiddenEntityIds: mode === 'replace' ? [] : base.hiddenEntityIds,
    };

    this.save({
      ...data,
      overrides: newOverrides,
    });
  }
}

export const storageService = new StorageService();
