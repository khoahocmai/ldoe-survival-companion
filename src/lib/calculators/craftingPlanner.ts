import { Item, Recipe } from '../../types';

export interface CraftingPlanParams {
  targetItemId: string;
  quantity: number;
  inventory: Record<string, number>;
  recipesByOutput: Map<string, Recipe[]>;
  itemsMap: Map<string, Item>;
}

export interface CraftingTreeNode {
  itemId: string;
  itemName: string;
  quantityRequired: number;
  usedFromInventory: number;
  stillNeeded: number;
  recipe?: Recipe;
  craftsNeeded: number;
  children: CraftingTreeNode[];
}

export interface RawMaterialRequirement {
  itemId: string;
  itemName: string;
  category?: string;
  required: number;
  inInventory: number;
  missing: number;
  isSatisfied: boolean;
}

export interface IntermediateCraftStep {
  itemId: string;
  itemName: string;
  craftCount: number;
  totalOutputQuantity: number;
  workstation?: string;
  ingredients: Array<{ itemId: string; itemName: string; quantity: number }>;
}

export interface CraftingPlanResult {
  isValid: boolean;
  targetItem?: Item;
  targetQuantity: number;
  tree: CraftingTreeNode | null;
  totalRawMaterials: RawMaterialRequirement[];
  intermediateSteps: IntermediateCraftStep[];
  hasCircularDependency: boolean;
  unresolvedItems: string[];
}

export function planCrafting(params: CraftingPlanParams): CraftingPlanResult {
  const { targetItemId, quantity, inventory, recipesByOutput, itemsMap } = params;

  if (!targetItemId || quantity <= 0) {
    return {
      isValid: false,
      targetQuantity: 0,
      tree: null,
      totalRawMaterials: [],
      intermediateSteps: [],
      hasCircularDependency: false,
      unresolvedItems: [],
    };
  }

  const targetItem = itemsMap.get(targetItemId) || {
    id: targetItemId,
    name: targetItemId,
    category: 'resource_raw',
    rarity: 'common',
    stackSize: 20,
    description: '',
    verificationStatus: 'unverified',
  };

  // Clone inventory so deductions are tracked globally without double-counting
  const remainingInventory: Record<string, number> = {};
  for (const [k, v] of Object.entries(inventory)) {
    remainingInventory[k] = Math.max(0, v);
  }

  const visiting = new Set<string>();
  let hasCircular = false;
  const unresolved = new Set<string>();
  const rawMaterialTotals: Record<string, number> = {};
  const craftStepMap = new Map<string, IntermediateCraftStep>();

  function resolveItem(itemId: string, neededQuantity: number): CraftingTreeNode {
    const item = itemsMap.get(itemId);
    const itemName = item?.name || itemId;

    // 1. Consume from inventory if available
    const available = remainingInventory[itemId] || 0;
    const usedFromInventory = Math.min(neededQuantity, available);
    remainingInventory[itemId] = available - usedFromInventory;
    const stillNeeded = neededQuantity - usedFromInventory;

    // If fully covered by inventory, we do not need to craft
    if (stillNeeded <= 0) {
      return {
        itemId,
        itemName,
        quantityRequired: neededQuantity,
        usedFromInventory,
        stillNeeded: 0,
        craftsNeeded: 0,
        children: [],
      };
    }

    // 2. Check circular dependency
    if (visiting.has(itemId)) {
      hasCircular = true;
      rawMaterialTotals[itemId] = (rawMaterialTotals[itemId] || 0) + stillNeeded;
      return {
        itemId,
        itemName,
        quantityRequired: neededQuantity,
        usedFromInventory,
        stillNeeded,
        craftsNeeded: 0,
        children: [],
      };
    }

    // 3. Look for recipes
    const candidateRecipes = recipesByOutput.get(itemId) || [];
    const recipe = candidateRecipes.length > 0 ? candidateRecipes[0] : undefined;

    if (!recipe || recipe.ingredients.length === 0) {
      // Base raw material or uncraftable
      rawMaterialTotals[itemId] = (rawMaterialTotals[itemId] || 0) + stillNeeded;
      if (!recipe && !itemsMap.has(itemId)) {
        unresolved.add(itemId);
      }
      return {
        itemId,
        itemName,
        quantityRequired: neededQuantity,
        usedFromInventory,
        stillNeeded,
        craftsNeeded: 0,
        children: [],
      };
    }

    // 4. Calculate craft count based on recipe outputQuantity
    const outputQty = recipe.outputQuantity > 0 ? recipe.outputQuantity : 1;
    const craftsNeeded = Math.ceil(stillNeeded / outputQty);
    const totalProduced = craftsNeeded * outputQty;

    // Put surplus back into inventory for other branches to use if applicable
    const surplus = totalProduced - stillNeeded;
    if (surplus > 0) {
      remainingInventory[itemId] = (remainingInventory[itemId] || 0) + surplus;
    }

    // Record craft step
    const existingStep = craftStepMap.get(recipe.id);
    if (existingStep) {
      existingStep.craftCount += craftsNeeded;
      existingStep.totalOutputQuantity += totalProduced;
    } else {
      craftStepMap.set(recipe.id, {
        itemId,
        itemName,
        craftCount: craftsNeeded,
        totalOutputQuantity: totalProduced,
        workstation: recipe.workstation,
        ingredients: recipe.ingredients.map((ing) => {
          const ingItem = itemsMap.get(ing.itemId);
          return {
            itemId: ing.itemId,
            itemName: ingItem?.name || ing.itemId,
            quantity: ing.quantity,
          };
        }),
      });
    }

    // Recurse on ingredients
    visiting.add(itemId);
    const children: CraftingTreeNode[] = [];

    for (const ing of recipe.ingredients) {
      const ingNeeded = ing.quantity * craftsNeeded;
      const childNode = resolveItem(ing.itemId, ingNeeded);
      children.push(childNode);
    }

    visiting.delete(itemId);

    return {
      itemId,
      itemName,
      quantityRequired: neededQuantity,
      usedFromInventory,
      stillNeeded,
      recipe,
      craftsNeeded,
      children,
    };
  }

  const rootNode = resolveItem(targetItemId, quantity);

  // Build raw materials summary list
  const totalRawMaterials: RawMaterialRequirement[] = Object.entries(rawMaterialTotals).map(([matId, required]) => {
    const item = itemsMap.get(matId);
    const inInv = inventory[matId] || 0;
    const missing = Math.max(0, required);
    return {
      itemId: matId,
      itemName: item?.name || matId,
      category: item?.category,
      required,
      inInventory: inInv,
      missing,
      isSatisfied: missing === 0,
    };
  });

  // Sort raw materials by name
  totalRawMaterials.sort((a, b) => a.itemName.localeCompare(b.itemName));

  // Intermediate steps array
  const intermediateSteps = Array.from(craftStepMap.values());

  return {
    isValid: true,
    targetItem,
    targetQuantity: quantity,
    tree: rootNode,
    totalRawMaterials,
    intermediateSteps,
    hasCircularDependency: hasCircular,
    unresolvedItems: Array.from(unresolved),
  };
}
