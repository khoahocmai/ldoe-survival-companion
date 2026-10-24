import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import itemsData from '../../public/data/items.json';

describe('Task 2: Weapon Mods Dataset Validation', () => {
  const filePath = path.resolve(__dirname, '../../public/data/weaponMods.json');

  it('should exist and contain valid weapon mods array', () => {
    expect(fs.existsSync(filePath), 'weaponMods.json file should exist').toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    const mods = JSON.parse(content);
    expect(Array.isArray(mods)).toBe(true);
    expect(mods.length).toBeGreaterThan(15);
  });

  it('should validate every mod references valid weapon and materials in items.json', () => {
    if (!fs.existsSync(filePath)) return;
    const mods = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const itemsMap = new Map(itemsData.map((i: any) => [i.id, i]));

    for (const mod of mods) {
      expect(mod.id, `Mod ${mod.name} must have non-empty id`).toBeTruthy();
      expect(mod.name, `Mod ${mod.id} must have non-empty name`).toBeTruthy();
      expect(mod.vietnameseName, `Mod ${mod.id} must have non-empty vietnameseName`).toBeTruthy();
      expect(['common', 'rare', 'extremely_rare']).toContain(mod.rarity);
      expect(['blade', 'tip', 'handle', 'muzzle', 'magazine', 'sight', 'grip', 'stock']).toContain(mod.slot);

      // Verify weapon exists
      const weapon = itemsMap.get(mod.weaponId);
      expect(weapon, `Weapon ${mod.weaponId} not found in items.json for mod ${mod.id}`).toBeDefined();
      expect(weapon.weaponStats, `Weapon ${mod.weaponId} must have weaponStats`).toBeDefined();

      // Verify materials
      expect(Array.isArray(mod.materials)).toBe(true);
      expect(mod.materials.length).toBeGreaterThan(0);
      for (const mat of mod.materials) {
        expect(itemsMap.has(mat.itemId), `Material ${mat.itemId} in mod ${mod.id} not found in items.json`).toBe(true);
        expect(mat.quantity).toBeGreaterThan(0);
      }
    }
  });

  it('should have mods for primary weapons including Spear, Cleaver, Machete, Glock 17, M16, AK-47, Shotgun', () => {
    if (!fs.existsSync(filePath)) return;
    const mods = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const targetWeapons = ['spear', 'cleaver', 'machete', 'glock_17', 'm16', 'ak47', 'shotgun'];
    const weaponsCovered = new Set(mods.map((m: any) => m.weaponId));

    for (const weaponId of targetWeapons) {
      expect(weaponsCovered.has(weaponId), `Weapon ${weaponId} has no mods defined`).toBe(true);
    }
  });
});
