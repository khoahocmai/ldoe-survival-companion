import { Item, LocationStructure, LocationStructureStage, Recipe } from '../../types';
import { planCrafting, CraftingPlanResult, CraftingTreeNode } from './craftingPlanner';

function collectInventoryUsage(node: CraftingTreeNode | null, usage: Record<string, number> = {}) {
  if (!node) return usage;
  if (node.usedFromInventory > 0) {
    usage[node.itemId] = (usage[node.itemId] || 0) + node.usedFromInventory;
  }
  node.children.forEach((child) => collectInventoryUsage(child, usage));
  return usage;
}

export interface ConstructionMaterialItem {
  itemId: string;
  itemName: string;
  category?: string;
  rarity?: string;
  totalRequired: number;
  availableInHand: number;
  missing: number;
  isSatisfied: boolean;
  byStage: Array<{
    stageId: string;
    stageName: string;
    quantity: number;
  }>;
  craftingPlan?: CraftingPlanResult;
}

export interface ConstructionCalculationResult {
  structure: LocationStructure;
  selectedStageIds: string[];
  stages: LocationStructureStage[];
  materials: ConstructionMaterialItem[];
  totalUniqueItems: number;
  totalItemsCount: number;
  allSatisfied: boolean;
  completionPercent: number;
}

export function calculateConstructionRequirements(params: {
  structure: LocationStructure;
  stageIds?: string[]; // if omitted or empty, all stages
  availableMaterials?: Record<string, number>;
  itemsMap: Map<string, Item>;
  recipesByOutput?: Map<string, Recipe[]>;
  includeCraftingBreakdown?: boolean;
}): ConstructionCalculationResult {
  const {
    structure,
    stageIds,
    availableMaterials = {},
    itemsMap,
    recipesByOutput,
    includeCraftingBreakdown = false,
  } = params;

  const activeStages =
    stageIds && stageIds.length > 0
      ? structure.stages.filter((s) => stageIds.includes(s.id))
      : structure.stages;

  const materialMap = new Map<
    string,
    {
      totalRequired: number;
      byStage: Array<{ stageId: string; stageName: string; quantity: number }>;
    }
  >();

  let totalItemsCount = 0;

  for (const stage of activeStages) {
    for (const req of stage.requirements) {
      totalItemsCount += req.quantity;
      const current = materialMap.get(req.itemId) || { totalRequired: 0, byStage: [] };
      current.totalRequired += req.quantity;
      current.byStage.push({
        stageId: stage.id,
        stageName: stage.name,
        quantity: req.quantity,
      });
      materialMap.set(req.itemId, current);
    }
  }

  let satisfiedCount = 0;
  const materials: ConstructionMaterialItem[] = [];
  // Shared pool so one stock of an ingredient is not counted for several crafting breakdowns.
  const ingredientPool: Record<string, number> = { ...availableMaterials };

  for (const [itemId, data] of materialMap.entries()) {
    const item = itemsMap.get(itemId);
    const itemName = item?.name || itemId;
    const available = Math.max(0, availableMaterials[itemId] || 0);
    const missing = Math.max(0, data.totalRequired - available);
    const isSatisfied = missing === 0;

    if (isSatisfied) satisfiedCount++;

    let craftingPlan: CraftingPlanResult | undefined;
    if (includeCraftingBreakdown && recipesByOutput && missing > 0) {
      // `missing` already excludes the stock of this very item, so hide it from the planner
      // to avoid subtracting it a second time.
      craftingPlan = planCrafting({
        targetItemId: itemId,
        quantity: missing,
        inventory: { ...ingredientPool, [itemId]: 0 },
        recipesByOutput,
        itemsMap,
      });
      const used = collectInventoryUsage(craftingPlan.tree);
      for (const [usedId, qty] of Object.entries(used)) {
        ingredientPool[usedId] = Math.max(0, (ingredientPool[usedId] || 0) - qty);
      }
    }

    materials.push({
      itemId,
      itemName,
      category: item?.category,
      rarity: item?.rarity,
      totalRequired: data.totalRequired,
      availableInHand: available,
      missing,
      isSatisfied,
      byStage: data.byStage,
      craftingPlan,
    });
  }

  materials.sort((a, b) => {
    // Missing items first, then by name
    if (!a.isSatisfied && b.isSatisfied) return -1;
    if (a.isSatisfied && !b.isSatisfied) return 1;
    return a.itemName.localeCompare(b.itemName);
  });

  const totalUnique = materials.length;
  const completionPercent = totalUnique > 0 ? Math.round((satisfiedCount / totalUnique) * 100) : 100;

  return {
    structure,
    selectedStageIds: activeStages.map((s) => s.id),
    stages: activeStages,
    materials,
    totalUniqueItems: totalUnique,
    totalItemsCount,
    allSatisfied: satisfiedCount === totalUnique,
    completionPercent,
  };
}
