import { useState, useEffect, useCallback } from 'react';
import { storageService, DEFAULT_USER_DATA } from '../services/storageService';
import { UserDataSchema, Goal, UserNote, WeaponInstance, FavoriteItem } from '../types';

export function usePersonalData() {
  const [data, setData] = useState<UserDataSchema>(() => {
    try {
      return storageService.load();
    } catch {
      return DEFAULT_USER_DATA;
    }
  });

  const refresh = useCallback(() => {
    setData({ ...storageService.load() });
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      refresh();
    };

    window.addEventListener('ldoe_storage_change', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('ldoe_storage_change', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refresh]);

  // Inventory helpers
  const setInventoryItem = useCallback((itemId: string, quantity: number) => {
    storageService.setInventoryItem(itemId, quantity);
  }, []);

  const adjustInventoryItem = useCallback((itemId: string, delta: number) => {
    storageService.adjustInventoryItem(itemId, delta);
  }, []);

  // Weapon Instance helpers
  const addWeaponInstance = useCallback((instance: Omit<WeaponInstance, 'id' | 'createdAt'>) => {
    return storageService.addWeaponInstance(instance);
  }, []);

  const updateWeaponInstance = useCallback((id: string, updates: Partial<WeaponInstance>) => {
    storageService.updateWeaponInstance(id, updates);
  }, []);

  const removeWeaponInstance = useCallback((id: string) => {
    storageService.removeWeaponInstance(id);
  }, []);

  // Quest progress helpers
  const setQuestStepCompleted = useCallback((questId: string, stepId: string, completed: boolean) => {
    storageService.setQuestStepCompleted(questId, stepId, completed);
  }, []);

  const setQuestStatus = useCallback((questId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    storageService.setQuestStatus(questId, status);
  }, []);

  // Goal helpers
  const addGoal = useCallback((title: string, targetItemId: string, targetQuantity: number, notes?: string) => {
    return storageService.addGoal(title, targetItemId, targetQuantity, notes);
  }, []);

  const toggleGoal = useCallback((id: string) => {
    storageService.toggleGoal(id);
  }, []);

  const removeGoal = useCallback((id: string) => {
    storageService.removeGoal(id);
  }, []);

  // Note helpers
  const addNote = useCallback((note: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    return storageService.addNote(note);
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<UserNote>) => {
    storageService.updateNote(id, updates);
  }, []);

  const removeNote = useCallback((id: string) => {
    storageService.removeNote(id);
  }, []);

  // Favorite helpers
  const toggleFavorite = useCallback((type: FavoriteItem['type'], id: string) => {
    return storageService.toggleFavorite(type, id);
  }, []);

  const isFavorite = useCallback(
    (type: FavoriteItem['type'], id: string) => {
      return data.favorites.some((f) => f.type === type && f.id === id);
    },
    [data.favorites]
  );

  // Recently viewed
  const addRecentlyViewed = useCallback((type: FavoriteItem['type'], id: string) => {
    storageService.addRecentlyViewed(type, id);
  }, []);

  return {
    data,
    inventory: data.inventory,
    weaponInstances: data.weaponInstances,
    questProgress: data.questProgress,
    goals: data.goals,
    notes: data.notes,
    favorites: data.favorites,
    recentlyViewed: data.recentlyViewed,
    setInventoryItem,
    adjustInventoryItem,
    addWeaponInstance,
    updateWeaponInstance,
    removeWeaponInstance,
    setQuestStepCompleted,
    setQuestStatus,
    addGoal,
    toggleGoal,
    removeGoal,
    addNote,
    updateNote,
    removeNote,
    toggleFavorite,
    isFavorite,
    addRecentlyViewed,
    refresh,
  };
}
