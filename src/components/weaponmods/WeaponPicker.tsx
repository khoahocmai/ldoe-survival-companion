import React, { useMemo, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Item } from '../../types';
import { Badge } from '../common/Badge';
import { IconButton } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { EntityImage } from '../common/EntityImage';
import { FilterChips } from '../common/Layout';
import { SearchInput } from '../common/SearchInput';

export type WeaponFilter = 'all' | 'melee' | 'firearm';

const FILTER_OPTIONS: Array<{ id: WeaponFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'melee', label: 'Cận chiến' },
  { id: 'firearm', label: 'Súng' },
];

interface WeaponPickerProps {
  weapons: Item[];
  modCounts: Map<string, number>;
  selectedId: string;
  onSelect: (id: string) => void;
}

const matchesFilter = (w: Item, filter: WeaponFilter) =>
  filter === 'all' || (filter === 'melee' ? w.category === 'weapon_melee' : w.category === 'weapon_firearm');

/** Vertical weapon list that can fold down to a thin strip of thumbnails. Used on wide screens. */
export const WeaponRail: React.FC<WeaponPickerProps & { collapsed: boolean; onToggle: () => void }> = ({
  weapons,
  modCounts,
  selectedId,
  onSelect,
  collapsed,
  onToggle,
}) => {
  const [filter, setFilter] = useState<WeaponFilter>('all');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return weapons.filter(
      (w) => matchesFilter(w, filter) && (!q || `${w.name} ${w.vietnameseName ?? ''}`.toLowerCase().includes(q))
    );
  }, [weapons, filter, search]);

  return (
    <aside
      aria-label="Danh sách vũ khí"
      className={`sticky top-0 flex max-h-[calc(100vh-5rem)] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className={`flex items-center border-b border-line px-3 py-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <h2 className="text-sm font-semibold">Vũ khí ({weapons.length})</h2>}
        <IconButton label={collapsed ? 'Mở danh sách vũ khí' : 'Thu gọn danh sách vũ khí'} onClick={onToggle} className="h-8 w-8">
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </IconButton>
      </div>

      {!collapsed && (
        <div className="space-y-2 border-b border-line p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm vũ khí..." />
          <FilterChips options={FILTER_OPTIONS} value={filter} onChange={(id) => setFilter(id as WeaponFilter)} />
        </div>
      )}

      <ul className={`flex-1 space-y-0.5 overflow-y-auto ${collapsed ? 'p-2' : 'p-2'}`}>
        {visible.map((w) => {
          const active = w.id === selectedId;
          const count = modCounts.get(w.id) ?? 0;
          return (
            <li key={w.id}>
              <Tooltip label={collapsed ? w.name : undefined}>
              <button
                type="button"
                onClick={() => onSelect(w.id)}
                aria-label={collapsed ? w.name : undefined}
                aria-current={active ? 'true' : undefined}
                className={`flex w-full items-center rounded-lg text-left transition-colors ${
                  collapsed ? 'justify-center p-1' : 'gap-3 p-2'
                } ${active ? 'bg-accent-soft' : 'hover:bg-subtle'}`}
              >
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-subtle">
                  <EntityImage folder="items" id={w.id} image={w.image} alt={w.name} compact />
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${active ? 'text-accent' : ''}`}>{w.name}</span>
                    <span className="block truncate text-xs text-muted">{w.vietnameseName || '—'}</span>
                  </span>
                )}
                {!collapsed && (count > 0 ? <Badge tone={active ? 'accent' : 'neutral'}>{count}</Badge> : null)}
              </button>
              </Tooltip>
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-2 py-6 text-center text-xs text-muted">Không có vũ khí phù hợp.</li>}
      </ul>
    </aside>
  );
};

/** Horizontal strip of weapon chips for screens too narrow for the rail. */
export const WeaponStrip: React.FC<WeaponPickerProps> = ({ weapons, modCounts, selectedId, onSelect }) => {
  const [filter, setFilter] = useState<WeaponFilter>('all');
  const visible = weapons.filter((w) => matchesFilter(w, filter));

  return (
    <div className="mb-5 space-y-3">
      <FilterChips options={FILTER_OPTIONS} value={filter} onChange={(id) => setFilter(id as WeaponFilter)} />
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-6 sm:px-6">
        {visible.map((w) => {
          const active = w.id === selectedId;
          return (
            <li key={w.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(w.id)}
                aria-current={active ? 'true' : undefined}
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors ${
                  active ? 'border-accent-solid bg-accent-soft font-medium text-accent' : 'border-line bg-surface text-muted hover:text-fg'
                }`}
              >
                <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-subtle">
                  <EntityImage folder="items" id={w.id} image={w.image} alt={w.name} compact />
                </span>
                {w.name}
                {(modCounts.get(w.id) ?? 0) > 0 && <span className="num text-xs opacity-60">{modCounts.get(w.id)}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
