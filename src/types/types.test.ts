import { describe, it, expect } from 'vitest';
import itemsData from '../../public/data/items.json';
import type { WeaponMod, WeaponModSlot, WeaponModStatBonus, LocationStructure, StructureFrequency } from './index';

describe('Task 1: Weapon Mod Types & Components', () => {
  it('should have required mod crafting materials in items.json', () => {
    const requiredItemIds = [
      'factory_parts',
      'carbon_composite',
      'spring',
      'hi_tech_component',
      'gun_oil',
      'lens',
    ];

    const existingIds = new Set(itemsData.map((i: any) => i.id));
    for (const reqId of requiredItemIds) {
      expect(existingIds.has(reqId), `Missing mod crafting material in items.json: ${reqId}`).toBe(true);
    }
  });

  it('should support WeaponMod typing constructs', () => {
    const slot: WeaponModSlot = 'blade';
    const stats: WeaponModStatBonus = {
      damage: 4,
      attackSpeed: 0.08,
      critChance: 10,
    };
    const sampleMod: WeaponMod = {
      id: 'mod_cleaver_tactical_blade',
      weaponId: 'cleaver',
      slot,
      name: 'Tactical Butcher Blade',
      vietnameseName: 'Lưỡi dao mổ chiến thuật',
      rarity: 'rare',
      stats,
      materials: [{ itemId: 'steel_bar', quantity: 4 }],
    };

    expect(sampleMod.id).toBe('mod_cleaver_tactical_blade');
    expect(sampleMod.stats.damage).toBe(4);
  });
});

describe('Task 1: LocationStructure Frequency & Chopper Items', () => {
  it('should have required chopper parts in items.json', () => {
    const chopperItemIds = [
      'chopper_wheel',
      'chopper_fork',
      'chopper_gas_tank',
      'chopper_magazine',
      'transistor',
      'usb_drive',
    ];

    const existingIds = new Set(itemsData.map((i: any) => i.id));
    for (const itemId of chopperItemIds) {
      expect(existingIds.has(itemId), `Missing item in items.json: ${itemId}`).toBe(true);
    }
  });

  it('should support LocationStructure frequency and cycleConfig typing', () => {
    const freq: StructureFrequency = 'recurring';
    const structure: LocationStructure = {
      id: 'struct_gas_station_chopper',
      locationId: 'gas_station',
      name: "Jane's Chopper Workshop",
      frequency: freq,
      type: 'upgrade',
      stages: [],
      cycleConfig: {
        resetHours: 24,
        progressionType: 'vehicle_exp',
        maxLevel: 100,
        acceptedItems: [
          {
            itemId: 'bolts',
            valuePerItem: 3,
            dailyLimit: 100,
            tier: 'recommended',
          },
        ],
        perkGuide: [
          {
            name: 'Trunk Capacity',
            tier: 'S',
            description: 'Mở rộng cốp xe',
          },
        ],
      },
    };

    expect(structure.frequency).toBe('recurring');
    expect(structure.cycleConfig?.acceptedItems[0].itemId).toBe('bolts');
    expect(structure.cycleConfig?.acceptedItems[0].valuePerItem).toBe(3);
  });
});
