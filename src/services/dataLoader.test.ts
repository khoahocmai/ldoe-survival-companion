import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadGameData, clearDataCache } from './dataLoader';
import { storageService } from './storageService';

describe('Task 3: DataLoader & StorageService Weapon Mods integration', () => {
  beforeEach(() => {
    clearDataCache();
    vi.restoreAllMocks();

    // Stub global fetch to serve actual JSON from public/data/
    vi.spyOn(global, 'fetch').mockImplementation((url: any) => {
      const urlStr = String(url);
      const match = urlStr.match(/data\/([^/?#]+)$/);
      if (!match) {
        return Promise.resolve(new Response('Not found', { status: 404 }));
      }
      const filename = match[1];
      const diskPath = path.resolve(__dirname, '../../public/data', filename);
      if (fs.existsSync(diskPath)) {
        const fileContent = fs.readFileSync(diskPath, 'utf-8');
        return Promise.resolve(new Response(fileContent, { status: 200 }));
      }
      return Promise.resolve(new Response('Not found', { status: 404 }));
    });
  });

  it('storageService should initialize overrides with customWeaponMods array', () => {
    const overrides = storageService.getOverrides();
    expect(Array.isArray(overrides.customWeaponMods)).toBe(true);
  });

  it('loadGameData should load weaponMods and populate weaponModsMap and weaponModsByWeaponIdMap', async () => {
    const db = await loadGameData(true);
    expect(db.error).toBeNull();
    expect(Array.isArray(db.weaponMods)).toBe(true);
    expect(db.weaponMods.length).toBeGreaterThan(0);

    expect(db.weaponModsMap).toBeInstanceOf(Map);
    expect(db.weaponModsMap.size).toBe(db.weaponMods.length);

    expect(db.weaponModsByWeaponIdMap).toBeInstanceOf(Map);
    const cleaverMods = db.weaponModsByWeaponIdMap.get('cleaver');
    expect(cleaverMods).toBeDefined();
    expect(cleaverMods!.length).toBeGreaterThan(0);
    expect(cleaverMods!.every((m) => m.weaponId === 'cleaver')).toBe(true);
  });
});
