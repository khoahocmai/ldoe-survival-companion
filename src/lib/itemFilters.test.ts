import { describe, it, expect } from 'vitest';
import { Item } from '../types';
import { matchesItemFilter, sortItems, getItemTabPriority } from './itemFilters';

const createMockItem = (overrides: Partial<Item>): Item => ({
  id: 'test_item',
  name: 'Test Item',
  description: '',
  category: 'resource_raw',
  rarity: 'common',
  stackSize: 20,
  order: 0,
  ...overrides,
});

describe('itemFilters & item ordering', () => {
  it('should sort items with smaller order first (1 before 2)', () => {
    const item1 = createMockItem({ id: 'a', name: 'A', order: 1 });
    const item2 = createMockItem({ id: 'b', name: 'B', order: 2 });
    const item3 = createMockItem({ id: 'c', name: 'C', order: 10 });

    const list = [item3, item1, item2];
    list.sort((a, b) => sortItems(a, b, 'weapons'));

    expect(list.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('should place items with order=0 or undefined after ordered items (>= 1)', () => {
    const ordered1 = createMockItem({ id: 'ordered1', name: 'Zebra', order: 1 });
    const ordered2 = createMockItem({ id: 'ordered2', name: 'Alpha', order: 5 });
    const unorderedZero = createMockItem({ id: 'zeroItem', name: 'Beta', order: 0 });
    const unorderedUndefined = createMockItem({ id: 'undefItem', name: 'Charlie', order: undefined });

    const list = [unorderedZero, ordered2, unorderedUndefined, ordered1];
    list.sort((a, b) => sortItems(a, b, 'weapons'));

    expect(list[0].id).toBe('ordered1');
    expect(list[1].id).toBe('ordered2');
    // Unordered items with 0 or undefined follow after
    expect(list.slice(2).map((i) => i.id)).toContain('zeroItem');
    expect(list.slice(2).map((i) => i.id)).toContain('undefItem');
  });

  it('should sort strictly by order across different categories in "all" tab (e.g. backpack #3 before spear #4)', () => {
    const spear = createMockItem({ id: 'spear', category: 'weapon_melee', order: 4 });
    const backpack = createMockItem({ id: 'basic_backpack', category: 'special', order: 3 });
    const minigun = createMockItem({ id: 'minigun', category: 'weapon_firearm', order: 0 });

    const list = [spear, minigun, backpack];
    list.sort((a, b) => sortItems(a, b, 'all'));

    expect(list.map((i) => i.id)).toEqual(['basic_backpack', 'spear', 'minigun']);
  });

  it('should use category priority as tie-breaker when orders are identical', () => {
    const weapon = createMockItem({ id: 'weapon', category: 'weapon_melee', order: 1 });
    const armor = createMockItem({ id: 'armor', category: 'armor_head', order: 1 });
    const tool = createMockItem({ id: 'tool', category: 'tool', order: 1 });
    const med = createMockItem({ id: 'med', category: 'medical', order: 1 });
    const comp = createMockItem({ id: 'comp', category: 'component', order: 1 });

    const list = [comp, med, tool, armor, weapon];
    list.sort((a, b) => sortItems(a, b, 'all'));

    expect(list.map((i) => i.id)).toEqual(['weapon', 'armor', 'tool', 'med', 'comp']);
  });

  it('should match backpacks in armor filter and exclude them from components', () => {
    const backpack = createMockItem({ id: 'basic_backpack', category: 'special' });
    const c4 = createMockItem({ id: 'c4_explosive', category: 'special' });
    const bolt = createMockItem({ id: 'bolts', category: 'component' });

    expect(matchesItemFilter(backpack, 'armor')).toBe(true);
    expect(matchesItemFilter(backpack, 'components')).toBe(false);

    expect(matchesItemFilter(c4, 'components')).toBe(true);
    expect(matchesItemFilter(bolt, 'components')).toBe(true);
  });

  it('should match workstation items in workstations filter', () => {
    const smallBox = createMockItem({ id: 'small_box', category: 'workstation' });
    expect(matchesItemFilter(smallBox, 'workstations')).toBe(true);
    expect(matchesItemFilter(smallBox, 'tools')).toBe(false);
  });

  it('should match furniture items in furniture filter', () => {
    const shower = createMockItem({ id: 'shower', category: 'furniture' });
    expect(matchesItemFilter(shower, 'furniture')).toBe(true);
    expect(matchesItemFilter(shower, 'workstations')).toBe(false);
  });
});
