import { describe, it, expect } from 'vitest';
import { planCrafting } from './craftingPlanner';
import { Recipe, Item } from '../../types';

describe('craftingPlanner', () => {
  const dummyRecipes: Recipe[] = [
    {
      id: 'r_plank',
      outputItemId: 'pine_plank',
      outputQuantity: 1,
      ingredients: [{ itemId: 'pine_log', quantity: 1 }],
      verificationStatus: 'verified',
    },
    {
      id: 'r_iron_bar',
      outputItemId: 'iron_bar',
      outputQuantity: 1,
      ingredients: [{ itemId: 'iron_ore', quantity: 2 }],
      verificationStatus: 'verified',
    },
    {
      id: 'r_nails',
      outputItemId: 'nails',
      outputQuantity: 2, // crafts 2 at a time!
      ingredients: [{ itemId: 'iron_bar', quantity: 1 }],
      verificationStatus: 'verified',
    },
    {
      id: 'r_devastator',
      outputItemId: 'spiked_devastator',
      outputQuantity: 1,
      ingredients: [
        { itemId: 'pine_plank', quantity: 8 },
        { itemId: 'iron_bar', quantity: 6 },
        { itemId: 'nails', quantity: 5 },
      ],
      verificationStatus: 'verified',
    },
    {
      id: 'r_spear',
      outputItemId: 'spear',
      outputQuantity: 1,
      ingredients: [{ itemId: 'pine_log', quantity: 3 }],
      verificationStatus: 'verified',
    },
  ];

  const dummyItems: Item[] = [
    { id: 'pine_log', name: 'Pine Log', category: 'resource_raw', rarity: 'common', stackSize: 20, description: '', verificationStatus: 'verified' },
    { id: 'pine_plank', name: 'Pine Plank', category: 'resource_processed', rarity: 'common', stackSize: 20, description: '', verificationStatus: 'verified' },
    { id: 'iron_ore', name: 'Iron Ore', category: 'resource_raw', rarity: 'common', stackSize: 20, description: '', verificationStatus: 'verified' },
    { id: 'iron_bar', name: 'Iron Bar', category: 'resource_processed', rarity: 'common', stackSize: 20, description: '', verificationStatus: 'verified' },
    { id: 'nails', name: 'Nails', category: 'component', rarity: 'common', stackSize: 20, description: '', verificationStatus: 'verified' },
    { id: 'spiked_devastator', name: 'Spiked Devastator', category: 'weapon_melee', rarity: 'rare', stackSize: 1, description: '', verificationStatus: 'verified' },
    { id: 'spear', name: 'Spear', category: 'weapon_melee', rarity: 'common', stackSize: 1, description: '', verificationStatus: 'verified' },
  ];

  const itemsMap = new Map<string, Item>(dummyItems.map((i) => [i.id, i]));
  const recipesByOutputMap = new Map<string, Recipe[]>();
  for (const r of dummyRecipes) {
    const list = recipesByOutputMap.get(r.outputItemId) || [];
    list.push(r);
    recipesByOutputMap.set(r.outputItemId, list);
  }

  it('calculates simple direct recipe requirements', () => {
    // 2 Spears require 2 * 3 = 6 Pine Logs
    const plan = planCrafting({
      targetItemId: 'spear',
      quantity: 2,
      inventory: {},
      recipesByOutput: recipesByOutputMap,
      itemsMap,
    });

    expect(plan.isValid).toBe(true);
    expect(plan.targetItem?.id).toBe('spear');
    expect(plan.totalRawMaterials.length).toBe(1);
    expect(plan.totalRawMaterials[0].itemId).toBe('pine_log');
    expect(plan.totalRawMaterials[0].required).toBe(6);
    expect(plan.totalRawMaterials[0].missing).toBe(6);
  });

  it('calculates recursive nested requirements and output quantities', () => {
    // Spiked Devastator:
    // - 8 pine_plank -> 8 pine_log
    // - 5 nails (each craft yields 2, so ceil(5/2) = 3 crafts) -> 3 iron_bar
    // - 6 iron_bar (direct)
    // -> Total iron_bar needed = 6 + 3 = 9 iron_bar
    // -> 9 iron_bar * 2 iron_ore = 18 iron_ore
    const plan = planCrafting({
      targetItemId: 'spiked_devastator',
      quantity: 1,
      inventory: {},
      recipesByOutput: recipesByOutputMap,
      itemsMap,
    });

    expect(plan.isValid).toBe(true);
    const pineLogReq = plan.totalRawMaterials.find((m) => m.itemId === 'pine_log');
    const ironOreReq = plan.totalRawMaterials.find((m) => m.itemId === 'iron_ore');

    expect(pineLogReq?.required).toBe(8);
    expect(ironOreReq?.required).toBe(18);
  });

  it('deducts existing inventory correctly without double counting', () => {
    // Suppose player has 4 Iron Bars and 10 Pine Planks in inventory
    const plan = planCrafting({
      targetItemId: 'spiked_devastator',
      quantity: 1,
      inventory: {
        pine_plank: 10, // covers all 8 planks! No logs needed.
        iron_bar: 4, // covers 4 of the 9 needed bars. Remaining needed bars = 5 -> 10 iron_ore needed.
      },
      recipesByOutput: recipesByOutputMap,
      itemsMap,
    });

    expect(plan.isValid).toBe(true);
    // Planks are satisfied by inventory
    const pineLogReq = plan.totalRawMaterials.find((m) => m.itemId === 'pine_log');
    expect(pineLogReq?.missing || 0).toBe(0);

    // Remaining 5 bars need 10 ore
    const ironOreReq = plan.totalRawMaterials.find((m) => m.itemId === 'iron_ore');
    expect(ironOreReq?.missing).toBe(10);
  });

  it('detects circular recipe dependencies safely', () => {
    const loopRecipesByOutput = new Map<string, Recipe[]>();
    loopRecipesByOutput.set('item_a', [
      {
        id: 'r_a',
        outputItemId: 'item_a',
        outputQuantity: 1,
        ingredients: [{ itemId: 'item_b', quantity: 1 }],
        verificationStatus: 'verified',
      },
    ]);
    loopRecipesByOutput.set('item_b', [
      {
        id: 'r_b',
        outputItemId: 'item_b',
        outputQuantity: 1,
        ingredients: [{ itemId: 'item_a', quantity: 1 }],
        verificationStatus: 'verified',
      },
    ]);

    const plan = planCrafting({
      targetItemId: 'item_a',
      quantity: 1,
      inventory: {},
      recipesByOutput: loopRecipesByOutput,
      itemsMap: new Map(),
    });

    expect(plan.hasCircularDependency).toBe(true);
  });
});
