import { Item } from '../types';

export const ITEM_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'weapons', label: 'Vũ khí' },
  { id: 'armor', label: 'Giáp' },
  { id: 'tools', label: 'Công cụ' },
  { id: 'workstations', label: 'Bàn chế tạo' },
  { id: 'furniture', label: 'Nội thất' },
  { id: 'resources', label: 'Tài nguyên' },
  { id: 'medical', label: 'Y tế & thức ăn' },
  { id: 'components', label: 'Linh kiện' },
];

export const matchesItemFilter = (item: Item, filterId: string): boolean => {
  switch (filterId) {
    case 'weapons':
      return item.category.startsWith('weapon_');
    case 'armor':
      return (
        item.category.startsWith('armor_') ||
        item.id.includes('backpack') ||
        item.id.includes('collar') ||
        item.id.includes('protective_coat') ||
        item.id.includes('dog_saddle_bag')
      );
    case 'tools':
      return (
        item.category === 'tool' ||
        item.id === 'shovel' ||
        item.id === 'crowbar' ||
        item.id === 'torch' ||
        item.id === 'chainsaw' ||
        item.id.includes('turret') ||
        item.id.includes('drill')
      );
    case 'workstations':
      return item.category === 'workstation';
    case 'furniture':
      return item.category === 'furniture';
    case 'resources':
      return item.category.startsWith('resource_');
    case 'medical':
      return item.category === 'medical' || item.category === 'food';
    case 'components':
      return (
        item.category === 'component' ||
        (item.category === 'special' &&
          !item.id.includes('backpack') &&
          !item.id.includes('collar') &&
          !item.id.includes('protective_coat') &&
          !item.id.includes('dog_saddle_bag'))
      );
    default:
      return true;
  }
};

export const getItemTabPriority = (item: Item): number => {
  if (item.category.startsWith('weapon_')) return 1;
  if (
    item.category.startsWith('armor_') ||
    item.id.includes('backpack') ||
    item.id.includes('collar') ||
    item.id.includes('protective_coat') ||
    item.id.includes('dog_saddle_bag')
  ) {
    return 2;
  }
  if (
    item.category === 'tool' ||
    item.id === 'shovel' ||
    item.id === 'crowbar' ||
    item.id === 'torch' ||
    item.id === 'chainsaw' ||
    item.id.includes('turret') ||
    item.id.includes('drill')
  ) {
    return 3;
  }
  if (item.category === 'workstation') return 4;
  if (item.category === 'furniture') return 5;
  if (item.category.startsWith('resource_')) return 6;
  if (item.category === 'medical' || item.category === 'food') return 7;
  if (item.category === 'component') return 8;
  return 9;
};

/**
 * Sorts items strictly by order (1 is smallest, items with order >= 1 come first in ascending order).
 * Items with order = 0 (or unranked) go to the bottom.
 * Category priority and item name are used as tie-breakers when orders are equal.
 */
export const sortItems = (a: Item, b: Item, filterId?: string): number => {
  const rankA = typeof a.order === 'number' && a.order >= 1 ? a.order : null;
  const rankB = typeof b.order === 'number' && b.order >= 1 ? b.order : null;

  // Both have order >= 1: smaller number always comes first
  if (rankA !== null && rankB !== null) {
    if (rankA !== rankB) return rankA - rankB;
    // Tie-breaker when orders are identical: category priority, then name
    const prioDiff = getItemTabPriority(a) - getItemTabPriority(b);
    if (prioDiff !== 0) return prioDiff;
    return a.name.localeCompare(b.name);
  }

  // Item with order >= 1 comes before item with order 0 / unranked
  if (rankA !== null) return -1;
  if (rankB !== null) return 1;

  // Both have order = 0: group by category in 'all' tab, then sort by name
  if (filterId === 'all') {
    const prioDiff = getItemTabPriority(a) - getItemTabPriority(b);
    if (prioDiff !== 0) return prioDiff;
  }

  return a.name.localeCompare(b.name);
};
