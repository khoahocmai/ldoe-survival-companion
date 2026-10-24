import { describe, it, expect } from 'vitest';
import { calculateConstructionRequirements } from './constructionCalculator';
import { Item, LocationStructure, Recipe } from '../../types';

describe('constructionCalculator', () => {
  const dummyWatchtower: LocationStructure = {
    id: 'struct_northern_watchtower',
    locationId: 'northern_watchtower',
    name: 'Máy phát điện Tháp canh phương Bắc',
    type: 'repair',
    stages: [
      {
        id: 'stage_generator_craft',
        name: 'Giai đoạn 1: Chế tạo Generator',
        requirements: [
          { itemId: 'iron_plate', quantity: 15 },
          { itemId: 'nails', quantity: 10 },
          { itemId: 'rubber_parts', quantity: 5 },
        ],
      },
      {
        id: 'stage_watchtower_unlock',
        name: 'Giai đoạn 2: Lắp đặt tại Tháp',
        requirements: [
          { itemId: 'electric_generator', quantity: 1 },
          { itemId: 'gasoline', quantity: 5 },
        ],
      },
    ],
  };

  const dummyItems: Item[] = [
    { id: 'iron_plate', name: 'Iron Plate', category: 'resource_processed', rarity: 'common', stackSize: 20, description: '' },
    { id: 'nails', name: 'Nails', category: 'component', rarity: 'common', stackSize: 20, description: '' },
    { id: 'rubber_parts', name: 'Rubber Parts', category: 'component', rarity: 'common', stackSize: 20, description: '' },
    { id: 'electric_generator', name: 'Electric Generator', category: 'special', rarity: 'rare', stackSize: 1, description: '' },
    { id: 'gasoline', name: 'Gasoline', category: 'special', rarity: 'rare', stackSize: 20, description: '' },
  ];

  const itemsMap = new Map<string, Item>(dummyItems.map((i) => [i.id, i]));

  it('calculates total requirements across all stages correctly', () => {
    const result = calculateConstructionRequirements({
      structure: dummyWatchtower,
      itemsMap,
    });

    expect(result.totalUniqueItems).toBe(5);
    expect(result.totalItemsCount).toBe(15 + 10 + 5 + 1 + 5); // 36 items
    expect(result.allSatisfied).toBe(false);
    expect(result.completionPercent).toBe(0);

    const plates = result.materials.find((m) => m.itemId === 'iron_plate');
    expect(plates?.totalRequired).toBe(15);
    expect(plates?.missing).toBe(15);
  });

  it('calculates requirements for a subset of stages', () => {
    const result = calculateConstructionRequirements({
      structure: dummyWatchtower,
      stageIds: ['stage_watchtower_unlock'],
      itemsMap,
    });

    expect(result.selectedStageIds).toEqual(['stage_watchtower_unlock']);
    expect(result.totalUniqueItems).toBe(2);
    expect(result.totalItemsCount).toBe(6);

    const gen = result.materials.find((m) => m.itemId === 'electric_generator');
    expect(gen?.totalRequired).toBe(1);

    const gas = result.materials.find((m) => m.itemId === 'gasoline');
    expect(gas?.totalRequired).toBe(5);
  });

  it('factors in available in-hand materials and calculates completion percentage', () => {
    const result = calculateConstructionRequirements({
      structure: dummyWatchtower,
      stageIds: ['stage_generator_craft'],
      availableMaterials: {
        iron_plate: 15, // fully covered
        nails: 5, // half covered (needs 10)
        // rubber_parts: 0 covered (needs 5)
      },
      itemsMap,
    });

    expect(result.totalUniqueItems).toBe(3);

    const plates = result.materials.find((m) => m.itemId === 'iron_plate');
    expect(plates?.isSatisfied).toBe(true);
    expect(plates?.missing).toBe(0);

    const nails = result.materials.find((m) => m.itemId === 'nails');
    expect(nails?.isSatisfied).toBe(false);
    expect(nails?.missing).toBe(5);

    const rubber = result.materials.find((m) => m.itemId === 'rubber_parts');
    expect(rubber?.isSatisfied).toBe(false);
    expect(rubber?.missing).toBe(5);

    // 1 out of 3 satisfied = 33%
    expect(result.completionPercent).toBe(33);
    expect(result.allSatisfied).toBe(false);
  });

  it('does not subtract in-hand stock twice when building the crafting breakdown', () => {
    const generatorRecipe: Recipe = {
      id: 'recipe_generator',
      outputItemId: 'electric_generator',
      outputQuantity: 1,
      ingredients: [{ itemId: 'iron_plate', quantity: 4 }],
    };
    const structure: LocationStructure = {
      ...dummyWatchtower,
      stages: [{ id: 's', name: 'S', requirements: [{ itemId: 'electric_generator', quantity: 3 }] }],
    };

    const result = calculateConstructionRequirements({
      structure,
      itemsMap,
      availableMaterials: { electric_generator: 1, iron_plate: 100 },
      recipesByOutput: new Map([['electric_generator', [generatorRecipe]]]),
      includeCraftingBreakdown: true,
    });

    const gen = result.materials.find((m) => m.itemId === 'electric_generator')!;
    // Need 3, have 1 -> craft 2. Previously the planner re-applied the stock of 1 and crafted only 1.
    expect(gen.missing).toBe(2);
    expect(gen.craftingPlan?.tree?.craftsNeeded).toBe(2);
    expect(gen.craftingPlan?.intermediateSteps[0].craftCount).toBe(2);
  });

  it('shares one ingredient stock between several crafting breakdowns', () => {
    const recipes = new Map<string, Recipe[]>([
      ['nails', [{ id: 'r_nails', outputItemId: 'nails', outputQuantity: 1, ingredients: [{ itemId: 'iron_plate', quantity: 1 }] }]],
      ['rubber_parts', [{ id: 'r_rubber', outputItemId: 'rubber_parts', outputQuantity: 1, ingredients: [{ itemId: 'iron_plate', quantity: 1 }] }]],
    ]);
    const structure: LocationStructure = {
      ...dummyWatchtower,
      stages: [
        {
          id: 's',
          name: 'S',
          requirements: [
            { itemId: 'nails', quantity: 3 },
            { itemId: 'rubber_parts', quantity: 3 },
          ],
        },
      ],
    };

    const result = calculateConstructionRequirements({
      structure,
      itemsMap,
      availableMaterials: { iron_plate: 4 },
      recipesByOutput: recipes,
      includeCraftingBreakdown: true,
    });

    const totalMissingPlates = result.materials
      .flatMap((m) => m.craftingPlan?.totalRawMaterials ?? [])
      .filter((r) => r.itemId === 'iron_plate')
      .reduce((sum, r) => sum + r.missing, 0);

    // 6 plates needed overall, 4 in hand -> exactly 2 still missing (not 0).
    expect(totalMissingPlates).toBe(2);
  });
});
