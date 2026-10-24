import { UserDataSchema, Goal, UserNote, WeaponInstance, FavoriteItem, QuestUserProgress } from '../types';

const STORAGE_KEY = 'ldoe_companion_personal_data_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_USER_DATA: UserDataSchema = {
  version: CURRENT_SCHEMA_VERSION,
  inventory: {
    pine_log: 40,
    pine_plank: 20,
    iron_bar: 15,
    leather: 8,
    cloth: 25,
    nails: 10,
    duct_tape: 6,
    bandage: 8,
    spear: 2,
    crowbar: 1,
  },
  weaponInstances: [
    {
      id: 'demo_crowbar_1',
      itemId: 'crowbar',
      durabilityPercent: 85,
      notes: 'Dùng đi farm gỗ thông',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_glock_1',
      itemId: 'glock_17',
      durabilityPercent: 60,
      notes: 'Dự phòng cho Frenzied Giant',
      createdAt: new Date().toISOString(),
    },
  ],
  questProgress: {
    quest_act1_ch1: {
      status: 'in_progress',
      completedStepIds: ['step_1_gather_wood', 'step_2_craft_spear'],
      updatedAt: new Date().toISOString(),
    },
  },
  goals: [
    {
      id: 'goal_craft_machete',
      title: 'Chế tạo Machete đi rừng đỏ',
      targetItemId: 'machete',
      targetQuantity: 1,
      completed: false,
      notes: 'Cần nung thêm sắt và gom da thuộc',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  notes: [
    {
      id: 'note_wall_trick',
      title: 'Mẹo Wall-trick cho Frenzied Giant',
      content: 'Đứng sát mép tường cửa ra vào tại Tầng 2 Bunker Alfa. Đợi FG vung tay vào tường phát ra tiếng "bịch", bước ra đập 1 nhịp bằng Crowbar/Cleaver rồi lập tức thụt lại sau mép cửa.',
      linkedEntity: {
        type: 'enemy',
        id: 'frenzied_giant',
        name: 'Frenzied Giant',
      },
      isPinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  favorites: [
    { type: 'item', id: 'crowbar', addedAt: new Date().toISOString() },
    { type: 'item', id: 'glock_17', addedAt: new Date().toISOString() },
    { type: 'enemy', id: 'frenzied_giant', addedAt: new Date().toISOString() },
  ],
  recentlyViewed: [
    { type: 'item', id: 'crowbar', timestamp: Date.now() },
    { type: 'enemy', id: 'frenzied_giant', timestamp: Date.now() - 1000 },
  ],
  settings: {
    language: 'vi',
    compactView: false,
  },
};

// Dispatch change notification for UI reactivity
export function notifyStorageChange(reason: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ldoe_storage_change', { detail: { reason } }));
  }
}

class PersonalStorageService {
  private cache: UserDataSchema | null = null;

  public load(): UserDataSchema {
    if (this.cache) return this.cache;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.cache = { ...DEFAULT_USER_DATA };
        this.save(this.cache, false);
        return this.cache;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Dữ liệu không hợp lệ');
      }

      // Merge defaults for missing fields across versions
      const merged: UserDataSchema = {
        version: CURRENT_SCHEMA_VERSION,
        inventory: typeof parsed.inventory === 'object' && parsed.inventory !== null ? parsed.inventory : {},
        weaponInstances: Array.isArray(parsed.weaponInstances) ? parsed.weaponInstances : [],
        questProgress: typeof parsed.questProgress === 'object' && parsed.questProgress !== null ? parsed.questProgress : {},
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        recentlyViewed: Array.isArray(parsed.recentlyViewed) ? parsed.recentlyViewed : [],
        settings: {
          ...DEFAULT_USER_DATA.settings,
          ...(parsed.settings || {}),
        },
      };

      this.cache = merged;
      return merged;
    } catch (err) {
      console.warn('Không thể đọc dữ liệu cá nhân từ localStorage, sử dụng mặc định:', err);
      this.cache = { ...DEFAULT_USER_DATA };
      return this.cache;
    }
  }

  public save(data: UserDataSchema, notify = true): void {
    try {
      this.cache = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (notify) {
        notifyStorageChange('save');
      }
    } catch (err) {
      console.error('Lỗi khi lưu vào localStorage:', err);
    }
  }

  // Inventory operations
  public getInventory(): Record<string, number> {
    return this.load().inventory;
  }

  public setInventoryItem(itemId: string, quantity: number): void {
    const data = this.load();
    const updatedInventory = { ...data.inventory };
    if (quantity <= 0) {
      delete updatedInventory[itemId];
    } else {
      updatedInventory[itemId] = Math.max(0, Math.floor(quantity));
    }
    this.save({ ...data, inventory: updatedInventory });
  }

  public adjustInventoryItem(itemId: string, delta: number): void {
    const current = this.load().inventory[itemId] || 0;
    this.setInventoryItem(itemId, current + delta);
  }

  // Weapon Instances with Durability
  public getWeaponInstances(): WeaponInstance[] {
    return this.load().weaponInstances;
  }

  public addWeaponInstance(instance: Omit<WeaponInstance, 'id' | 'createdAt'>): WeaponInstance {
    const data = this.load();
    const newInst: WeaponInstance = {
      ...instance,
      id: `wep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.save({
      ...data,
      weaponInstances: [newInst, ...data.weaponInstances],
    });
    return newInst;
  }

  public updateWeaponInstance(id: string, updates: Partial<WeaponInstance>): void {
    const data = this.load();
    const list = data.weaponInstances.map((w) => (w.id === id ? { ...w, ...updates } : w));
    this.save({ ...data, weaponInstances: list });
  }

  public removeWeaponInstance(id: string): void {
    const data = this.load();
    this.save({
      ...data,
      weaponInstances: data.weaponInstances.filter((w) => w.id !== id),
    });
  }

  // Quests Progress
  public getQuestProgress(questId: string): QuestUserProgress | undefined {
    return this.load().questProgress[questId];
  }

  public setQuestStepCompleted(questId: string, stepId: string, completed: boolean): void {
    const data = this.load();
    const current = data.questProgress[questId] || {
      status: 'in_progress',
      completedStepIds: [],
      updatedAt: new Date().toISOString(),
    };

    let stepIds = [...current.completedStepIds];
    if (completed && !stepIds.includes(stepId)) {
      stepIds.push(stepId);
    } else if (!completed) {
      stepIds = stepIds.filter((id) => id !== stepId);
    }

    const updated = {
      ...current,
      completedStepIds: stepIds,
      updatedAt: new Date().toISOString(),
    };

    this.save({
      ...data,
      questProgress: {
        ...data.questProgress,
        [questId]: updated,
      },
    });
  }

  public setQuestStatus(questId: string, status: 'not_started' | 'in_progress' | 'completed'): void {
    const data = this.load();
    const current = data.questProgress[questId] || {
      status,
      completedStepIds: [],
      updatedAt: new Date().toISOString(),
    };

    this.save({
      ...data,
      questProgress: {
        ...data.questProgress,
        [questId]: {
          ...current,
          status,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  // Goals
  public getGoals(): Goal[] {
    return this.load().goals;
  }

  public addGoal(title: string, targetItemId: string, targetQuantity: number, notes?: string): Goal {
    const data = this.load();
    const now = new Date().toISOString();
    const newGoal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      targetItemId,
      targetQuantity: Math.max(1, targetQuantity),
      completed: false,
      notes,
      createdAt: now,
      updatedAt: now,
    };
    this.save({
      ...data,
      goals: [newGoal, ...data.goals],
    });
    return newGoal;
  }

  public updateGoal(id: string, updates: Partial<Goal>): void {
    const data = this.load();
    const goals = data.goals.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g));
    this.save({ ...data, goals });
  }

  public toggleGoal(id: string): void {
    const data = this.load();
    const goals = data.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed, updatedAt: new Date().toISOString() } : g));
    this.save({ ...data, goals });
  }

  public removeGoal(id: string): void {
    const data = this.load();
    this.save({
      ...data,
      goals: data.goals.filter((g) => g.id !== id),
    });
  }

  // Notes
  public getNotes(): UserNote[] {
    return this.load().notes;
  }

  public addNote(note: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>): UserNote {
    const data = this.load();
    const now = new Date().toISOString();
    const newNote: UserNote = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.save({
      ...data,
      notes: [newNote, ...data.notes],
    });
    return newNote;
  }

  public updateNote(id: string, updates: Partial<UserNote>): void {
    const data = this.load();
    const notes = data.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
    this.save({ ...data, notes });
  }

  public removeNote(id: string): void {
    const data = this.load();
    this.save({
      ...data,
      notes: data.notes.filter((n) => n.id !== id),
    });
  }

  // Favorites
  public getFavorites(): FavoriteItem[] {
    return this.load().favorites;
  }

  public isFavorite(type: FavoriteItem['type'], id: string): boolean {
    return this.load().favorites.some((f) => f.type === type && f.id === id);
  }

  public toggleFavorite(type: FavoriteItem['type'], id: string): boolean {
    const data = this.load();
    const exists = data.favorites.some((f) => f.type === type && f.id === id);
    let updatedFavorites: FavoriteItem[];

    if (exists) {
      updatedFavorites = data.favorites.filter((f) => !(f.type === type && f.id === id));
    } else {
      updatedFavorites = [{ type, id, addedAt: new Date().toISOString() }, ...data.favorites];
    }

    this.save({ ...data, favorites: updatedFavorites });
    return !exists;
  }

  // Recently viewed
  public addRecentlyViewed(type: FavoriteItem['type'], id: string): void {
    const data = this.load();
    const filtered = data.recentlyViewed.filter((item) => !(item.type === type && item.id === id));
    const updated = [{ type, id, timestamp: Date.now() }, ...filtered].slice(0, 15);
    this.save({ ...data, recentlyViewed: updated }, false);
  }

  // Export / Import / Reset
  public exportData(): string {
    const data = this.load();
    const exportPayload = {
      app: 'LDoE Survival Companion',
      version: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  public validateImportData(jsonString: string): {
    valid: boolean;
    preview?: {
      inventoryCount: number;
      weaponCount: number;
      goalCount: number;
      noteCount: number;
      questCount: number;
      exportedAt?: string;
    };
    parsedData?: UserDataSchema;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Tệp không phải định dạng JSON hợp lệ.' };
      }

      // Check if wrapper or raw UserDataSchema
      const rawData = parsed.data || parsed;

      if (!rawData || typeof rawData !== 'object') {
        return { valid: false, error: 'Không tìm thấy cấu trúc dữ liệu người dùng bên trong tệp.' };
      }

      const inventory = rawData.inventory || {};
      const weapons = Array.isArray(rawData.weaponInstances) ? rawData.weaponInstances : [];
      const goals = Array.isArray(rawData.goals) ? rawData.goals : [];
      const notes = Array.isArray(rawData.notes) ? rawData.notes : [];
      const quests = rawData.questProgress || {};

      const preview = {
        inventoryCount: Object.keys(inventory).length,
        weaponCount: weapons.length,
        goalCount: goals.length,
        noteCount: notes.length,
        questCount: Object.keys(quests).length,
        exportedAt: parsed.exportedAt || undefined,
      };

      const validUserData: UserDataSchema = {
        version: CURRENT_SCHEMA_VERSION,
        inventory,
        weaponInstances: weapons,
        questProgress: quests,
        goals,
        notes,
        favorites: Array.isArray(rawData.favorites) ? rawData.favorites : [],
        recentlyViewed: Array.isArray(rawData.recentlyViewed) ? rawData.recentlyViewed : [],
        settings: {
          ...DEFAULT_USER_DATA.settings,
          ...(rawData.settings || {}),
        },
      };

      return { valid: true, preview, parsedData: validUserData };
    } catch (err: any) {
      return { valid: false, error: `Lỗi đọc tệp JSON: ${err?.message || 'Không xác định'}` };
    }
  }

  public applyImport(data: UserDataSchema): void {
    this.save(data);
  }

  public resetToDefaults(): void {
    this.save({ ...DEFAULT_USER_DATA });
  }
}

export const storageService = new PersonalStorageService();
