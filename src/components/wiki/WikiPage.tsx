import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, SearchX } from 'lucide-react';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { EmptyState, FilterChips, PageHeader } from '../common/Layout';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { storageService } from '../../services/storageService';
import { useGameData } from '../../context/DataContext';
import { WikiOverrides } from '../../types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { WikiSplitLayout, WIDE_QUERY } from './WikiSplitLayout';
import { WikiDetailPanel } from './WikiDetailPanel';
import { WikiDetailHeader } from './WikiDetailHeader';

type OverrideKey = keyof Omit<WikiOverrides, 'hiddenEntityIds'>;

interface FilterConfig<T> {
  options: Array<{ id: string; label: string }>;
  matches: (entity: T, filterId: string) => boolean;
}

export interface WikiDetailView {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  body: React.ReactNode;
}

interface WikiPageProps<T extends { id: string }> {
  title: string;
  description: string;
  icon: React.ReactNode;
  entities: T[];
  /** Singular noun used in labels, e.g. "vật phẩm". */
  noun: string;
  /** Which override list in storage this page edits. */
  overrideKey: OverrideKey;
  searchPlaceholder: string;
  getName: (entity: T) => string;
  getSearchText: (entity: T) => string;
  filter?: FilterConfig<T>;
  /**
   * `cards` (default): detail panel opens on selection. `tiles`: dense grid of small tiles with the detail
   * panel always open on wide screens, falling back to the first visible entity when nothing is selected.
   */
  layout?: 'cards' | 'tiles';
  sort?: (a: T, b: T, filterId: string) => number;
  renderCard: (entity: T, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  renderDetail: (entity: T) => WikiDetailView;
  /** Opens the page's edit dialog. Omit `entity` to start a new one. */
  onEdit: (entity?: T) => void;
  /** Dialogs owned by the page (edit form, extra confirms). */
  children?: React.ReactNode;
}

/**
 * Shared scaffold for the five encyclopedia pages: header, search + filters, card grid,
 * URL-driven selection (?select=id), detail panel and the hide/delete flow.
 * Pages only describe what is different (cards, detail body and the edit form).
 */
export function WikiPage<T extends { id: string }>({
  title,
  description,
  icon,
  entities,
  noun,
  overrideKey,
  searchPlaceholder,
  getName,
  getSearchText,
  filter,
  sort,
  layout = 'cards',
  renderCard,
  renderDetail,
  onEdit,
  children,
}: WikiPageProps<T>) {
  const { reload } = useGameData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filterId, setFilterId] = useState('all');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const selectId = searchParams.get('select');
  const selected = useMemo(() => entities.find((e) => e.id === selectId) ?? null, [entities, selectId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = entities.filter((e) => {
      if (filter && filterId !== 'all' && !filter.matches(e, filterId)) return false;
      return !q || getSearchText(e).toLowerCase().includes(q);
    });
    if (sort) {
      return [...list].sort((a, b) => sort(a, b, filterId));
    }
    return list;
  }, [entities, search, filter, filterId, getSearchText, sort]);

  const select = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (id) next.set('select', id);
      else next.delete('select');
      setSearchParams(next, { replace: Boolean(id && selectId) });
    },
    [searchParams, selectId, setSearchParams]
  );

  const close = useCallback(() => select(null), [select]);

  const isTiles = layout === 'tiles';
  // In tiles mode the panel never sits empty: show the first match until the user picks something.
  const active = selected ?? (isTiles ? (visible[0] ?? null) : null);
  // Below the wide breakpoint the panel is a drawer, so a tile that was only auto-picked must not look selected.
  const isWide = useMediaQuery(WIDE_QUERY);
  // Phones scroll the chips sideways instead of stacking rows, which would eat the pinned strip's height.
  const isSm = useMediaQuery('(min-width: 640px)');
  const highlighted = isWide ? active : selected;

  const handleDelete = async () => {
    if (!active) return;
    storageService.deleteOrHideEntity(overrideKey, active.id);
    await reload();
    close();
  };

  const detail = active ? renderDetail(active) : null;

  // Chips that would lead to an empty list are noise; the active one stays so it can still be switched off.
  const filterOptions = filter
    ? filter.options
        .map((opt) => ({
          ...opt,
          count: opt.id === 'all' ? entities.length : entities.filter((e) => filter.matches(e, opt.id)).length,
        }))
        .filter((opt) => opt.count > 0 || opt.id === filterId)
    : [];

  const listContent = (
    <div>
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={
          <Button icon={<Plus />} onClick={() => onEdit()}>
            <span className="hidden sm:inline">Thêm {noun}</span>
            <span className="sm:hidden">Thêm</span>
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} className={`sm:max-w-sm ${filter ? 'mb-4' : 'mb-2'}`} />
      {filter && (
        // Stays pinned while the grid scrolls underneath, so switching category never needs a trip back to the top.
        // The -4 offsets cancel <main>'s 1rem top padding, which sticky would otherwise leave as a gap above the strip.
        <div className="sticky -top-4 z-20 -mx-1 -mt-4 bg-bg px-1 pb-2 pt-3">
          <FilterChips options={filterOptions} value={filterId} onChange={setFilterId} wrap={isSm} />
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title={`Không có ${noun} nào phù hợp`}
          description="Thử từ khóa khác hoặc bỏ bộ lọc đang chọn."
          action={
            (search || filterId !== 'all') && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setFilterId('all');
                }}
              >
                Xóa bộ lọc
              </Button>
            )
          }
        />
      ) : (
        <div
          className={
            isTiles
              ? 'grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2'
              : `grid gap-2.5 ${
                  selected
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
                }`
          }
        >
          {visible.map((entity) => renderCard(entity, entity.id === highlighted?.id, () => select(entity.id)))}
        </div>
      )}
    </div>
  );

  const detailContent =
    active && detail ? (
      <WikiDetailPanel
        selectedId={active.id}
        header={
          <WikiDetailHeader
            title={detail.title}
            subtitle={detail.subtitle}
            badges={detail.badges}
            onEdit={() => onEdit(active)}
            onDelete={() => setIsDeleteOpen(true)}
            onClose={close}
            closeClassName={isTiles ? 'xl:hidden' : undefined}
          />
        }
      >
        {detail.body}
      </WikiDetailPanel>
    ) : null;

  return (
    <>
      <WikiSplitLayout listContent={listContent} detailContent={detailContent} selectedId={selected?.id ?? null} onClose={close} />
      {children}
      <ConfirmDialog
        isOpen={isDeleteOpen && Boolean(active)}
        title={`Ẩn ${noun} này?`}
        message={`"${active ? getName(active) : ''}" sẽ bị ẩn khỏi bách khoa.`}
        confirmLabel="Ẩn"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
}

/** Save helper shared by the edit forms: persist, refresh the merged database, then select the entity. */
export function useSaveEntity(overrideKey: OverrideKey) {
  const { reload } = useGameData();
  const [searchParams, setSearchParams] = useSearchParams();

  return useCallback(
    async (entity: { id: string }) => {
      storageService.saveEntity(overrideKey, entity);
      await reload();
      const next = new URLSearchParams(searchParams);
      next.set('select', entity.id);
      setSearchParams(next);
    },
    [overrideKey, reload, searchParams, setSearchParams]
  );
}
