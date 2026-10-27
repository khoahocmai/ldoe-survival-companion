import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, Search, Sword, Skull, Hammer, MapPin, Scroll, Building2, Target, CornerDownLeft } from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { Badge, Tone } from '../common/Badge';

type ResultType = 'item' | 'enemy' | 'recipe' | 'location' | 'quest' | 'structure' | 'points';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  url: string;
}

const TYPE_META: Record<ResultType, { label: string; icon: LucideIcon; tone: Tone }> = {
  item: { label: 'Vật phẩm', icon: Sword, tone: 'accent' },
  enemy: { label: 'Quái vật', icon: Skull, tone: 'danger' },
  recipe: { label: 'Công thức', icon: Hammer, tone: 'ok' },
  location: { label: 'Địa điểm', icon: MapPin, tone: 'info' },
  quest: { label: 'Nhiệm vụ', icon: Scroll, tone: 'warn' },
  structure: { label: 'Công trình', icon: Building2, tone: 'ok' },
  points: { label: 'Sự kiện', icon: Target, tone: 'info' },
};

const MAX_RESULTS = 20;

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const matches = (q: string, ...fields: Array<string | undefined>) =>
  fields.some((f) => f && f.toLowerCase().includes(q));

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { db } = useGameData();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActive(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !db) return [];
    const list: SearchResult[] = [];

    for (const item of db.items) {
      if (matches(q, item.name, item.vietnameseName, item.id, item.category)) {
        list.push({
          id: item.id,
          type: 'item',
          title: item.name,
          subtitle: item.vietnameseName || item.category,
          url: `/wiki/items?select=${item.id}`,
        });
      }
    }
    for (const enemy of db.enemies) {
      if (matches(q, enemy.name, enemy.vietnameseName, enemy.id)) {
        list.push({
          id: enemy.id,
          type: 'enemy',
          title: enemy.name,
          subtitle: `${enemy.vietnameseName ? `${enemy.vietnameseName} · ` : ''}${enemy.hp} HP`,
          url: `/wiki/enemies?select=${enemy.id}`,
        });
      }
    }
    for (const recipe of db.recipes) {
      const name = db.itemsMap.get(recipe.outputItemId)?.name || recipe.outputItemId;
      if (matches(q, name, recipe.id, recipe.workstation)) {
        list.push({
          id: recipe.id,
          type: 'recipe',
          title: name,
          subtitle: `${recipe.ingredients.length} nguyên liệu · ${recipe.workstation || 'Chế tạo tay'}`,
          url: `/wiki/recipes?select=${recipe.id}`,
        });
      }
    }
    for (const loc of db.locations) {
      if (matches(q, loc.name, loc.vietnameseName, loc.id)) {
        list.push({
          id: loc.id,
          type: 'location',
          title: loc.name,
          subtitle: loc.vietnameseName || `Độ nguy hiểm ${loc.dangerLevel}/5`,
          url: `/wiki/locations?select=${loc.id}`,
        });
      }
    }
    for (const quest of db.quests) {
      if (matches(q, quest.title, quest.vietnameseTitle, quest.description)) {
        list.push({
          id: quest.id,
          type: 'quest',
          title: quest.title,
          subtitle: `${quest.vietnameseTitle ? `${quest.vietnameseTitle} · ` : ''}${quest.objectives?.length || 0} mục tiêu`,
          url: `/wiki/quests?select=${quest.id}`,
        });
      }
    }
    for (const struct of db.locationStructures) {
      if (matches(q, struct.name, struct.id)) {
        list.push({
          id: struct.id,
          type: 'structure',
          title: struct.name,
          subtitle: `${struct.stages.length} giai đoạn`,
          url: `/construction?structure=${struct.id}`,
        });
      }
    }
    for (const system of db.pointSystems) {
      if (matches(q, system.name, system.id)) {
        list.push({
          id: system.id,
          type: 'points',
          title: system.name,
          subtitle: `${system.milestones.length} mốc · ${system.unit}`,
          url: `/points?system=${system.id}`,
        });
      }
    }
    return list.slice(0, MAX_RESULTS);
  }, [query, db]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm"
        className="relative z-raised w-full max-w-xl animate-pop-in overflow-hidden rounded-dialog border border-line bg-surface shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Tìm vật phẩm, quái, công thức, địa điểm..."
            className="h-12 w-full bg-transparent text-sm placeholder:text-faint focus:outline-none"
          />
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <p className="py-10 text-center text-sm text-muted">Gõ để tìm trong toàn bộ bách khoa.</p>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Không có kết quả cho “{query}”.</p>
          ) : (
            results.map((res, index) => {
              const meta = TYPE_META[res.type];
              const Icon = meta.icon;
              return (
                <button
                  key={`${res.type}-${res.id}`}
                  type="button"
                  data-index={index}
                  onClick={() => go(res)}
                  onMouseMove={() => setActive(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                    index === active ? 'bg-subtle' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{res.title}</span>
                    <span className="block truncate text-xs text-muted">{res.subtitle}</span>
                  </span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {index === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-faint" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
