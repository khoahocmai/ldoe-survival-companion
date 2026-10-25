import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Item } from '../../types';
import { ITEM_CATEGORY_LABEL } from '../../lib/labels';
import { ITEM_FILTERS, matchesItemFilter } from '../../lib/itemFilters';
import { EntityImage } from './EntityImage';
import { FilterChips } from './Layout';

interface ItemPickerProps {
  items: Item[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}

const Thumb: React.FC<{ item: Item; size: string }> = ({ item, size }) => (
  <span className={`${size} shrink-0 overflow-hidden rounded-md bg-subtle`}>
    <EntityImage folder="items" id={item.id} image={item.image} alt={item.name} compact />
  </span>
);

/**
 * Searchable replacement for a long <select>: type to find, or narrow by group and pick from the list.
 * Arrow keys move, Enter picks, Esc closes.
 */
export const ItemPicker: React.FC<ItemPickerProps> = ({ items, value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = items.find((i) => i.id === value);

  // Only offer groups that actually have an item in this list.
  const filterOptions = useMemo(
    () => ITEM_FILTERS.filter((f) => f.id === 'all' || items.some((i) => matchesItemFilter(i, f.id))),
    [items]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) => matchesItemFilter(i, filter) && (!q || `${i.name} ${i.vietnameseName ?? ''}`.toLowerCase().includes(q))
    );
  }, [items, query, filter]);

  useEffect(() => setActive(0), [query, filter, open]);

  // Every time it opens it starts fresh, not on the previous search or group.
  useEffect(() => {
    if (open) {
      setQuery('');
      setFilter('all');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (item: Item) => {
    onChange(item.id);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(visible.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && visible[active]) {
      e.preventDefault();
      pick(visible[active]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center gap-3 rounded-lg border border-line bg-surface px-2 text-left transition-colors hover:border-faint/60 focus:border-accent-solid focus:outline-none"
      >
        {selected ? (
          <>
            <Thumb item={selected} size="h-8 w-8" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium leading-tight">{selected.name}</span>
              {selected.vietnameseName && <span className="block truncate text-xs leading-tight text-muted">{selected.vietnameseName}</span>}
            </span>
          </>
        ) : (
          <span className="flex-1 px-1 text-sm text-faint">Chọn vật phẩm...</span>
        )}
        <ChevronDown className={`mr-1 h-4 w-4 shrink-0 text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 animate-pop-in overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
          onKeyDown={onKeyDown}
        >
          <div className="space-y-2 border-b border-line p-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Gõ tên vật phẩm..."
                aria-label="Tìm vật phẩm"
                className="h-9 w-full rounded-lg border border-line bg-bg pl-9 pr-3 text-sm placeholder:text-faint focus:border-accent-solid focus:outline-none"
              />
            </div>
            <FilterChips options={filterOptions} value={filter} onChange={setFilter} />
          </div>

          <ul ref={listRef} role="listbox" aria-label={label} className="max-h-[min(22rem,50vh)] overflow-y-auto p-1.5">
            {visible.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.id === value}
                  data-index={index}
                  onClick={() => pick(item)}
                  onMouseMove={() => setActive(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${
                    index === active ? 'bg-subtle' : ''
                  } ${item.id === value ? 'text-accent' : ''}`}
                >
                  <Thumb item={item} size="h-8 w-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium leading-tight">{item.name}</span>
                    {item.vietnameseName && <span className="block truncate text-xs leading-tight text-muted">{item.vietnameseName}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-faint">{ITEM_CATEGORY_LABEL[item.category] ?? item.category}</span>
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Không có vật phẩm phù hợp.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};
