import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '../../context/DataContext';
import { usePersonalData } from '../../hooks/usePersonalData';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  Search,
  Sword,
  Skull,
  Hammer,
  MapPin,
  Scroll,
  FileText,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'item' | 'enemy' | 'recipe' | 'location' | 'quest' | 'note';
  title: string;
  subtitle: string;
  badge?: string;
  url: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { db } = useGameData();
  const { notes, addRecentlyViewed } = usePersonalData();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !db) return [];

    const list: SearchResult[] = [];

    // Search Items
    for (const item of db.items) {
      if (
        item.name.toLowerCase().includes(q) ||
        (item.vietnameseName && item.vietnameseName.toLowerCase().includes(q)) ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      ) {
        list.push({
          id: item.id,
          type: 'item',
          title: item.name,
          subtitle: item.vietnameseName ? `${item.vietnameseName} (${item.category})` : item.category,
          badge: item.weaponStats ? 'Vũ khí' : item.armorStats ? 'Giáp' : 'Vật phẩm',
          url: `/wiki/items?select=${item.id}`,
        });
      }
    }

    // Search Enemies
    for (const enemy of db.enemies) {
      if (
        enemy.name.toLowerCase().includes(q) ||
        (enemy.vietnameseName && enemy.vietnameseName.toLowerCase().includes(q)) ||
        enemy.id.toLowerCase().includes(q)
      ) {
        list.push({
          id: enemy.id,
          type: 'enemy',
          title: enemy.name,
          subtitle: `${enemy.vietnameseName || ''} • HP: ${enemy.hp} • Sát thương: ${enemy.damage}`,
          badge: enemy.category === 'boss' ? 'BOSS' : 'Zombie',
          url: `/wiki/enemies?select=${enemy.id}`,
        });
      }
    }

    // Search Recipes
    for (const recipe of db.recipes) {
      const outputItem = db.itemsMap.get(recipe.outputItemId);
      const name = outputItem?.name || recipe.outputItemId;
      if (
        name.toLowerCase().includes(q) ||
        recipe.id.toLowerCase().includes(q) ||
        (recipe.workstation && recipe.workstation.toLowerCase().includes(q))
      ) {
        list.push({
          id: recipe.id,
          type: 'recipe',
          title: `Chế tạo ${name}`,
          subtitle: `${recipe.ingredients.length} nguyên liệu • ${recipe.workstation || 'Chế tạo tay'}`,
          badge: 'Công thức',
          url: `/planner?item=${recipe.outputItemId}`,
        });
      }
    }

    // Search Locations
    for (const loc of db.locations) {
      if (
        loc.name.toLowerCase().includes(q) ||
        (loc.vietnameseName && loc.vietnameseName.toLowerCase().includes(q)) ||
        loc.id.toLowerCase().includes(q)
      ) {
        list.push({
          id: loc.id,
          type: 'location',
          title: loc.name,
          subtitle: `${loc.vietnameseName || ''} • Độ nguy hiểm: ${loc.dangerLevel} sọ`,
          badge: loc.difficulty,
          url: `/wiki/locations?select=${loc.id}`,
        });
      }
    }

    // Search Quests
    for (const quest of db.quests) {
      if (
        quest.title.toLowerCase().includes(q) ||
        (quest.vietnameseTitle && quest.vietnameseTitle.toLowerCase().includes(q))
      ) {
        list.push({
          id: quest.id,
          type: 'quest',
          title: quest.title,
          subtitle: `${quest.vietnameseTitle || ''} • ${quest.steps.length} bước`,
          badge: 'Nhiệm vụ',
          url: `/quests?select=${quest.id}`,
        });
      }
    }

    // Search Notes
    for (const note of notes) {
      if (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)) {
        list.push({
          id: note.id,
          type: 'note',
          title: note.title,
          subtitle: note.content.slice(0, 50) + '...',
          badge: 'Ghi chú',
          url: `/notes`,
        });
      }
    }

    return list.slice(0, 15);
  }, [query, db, notes]);

  const handleSelect = (result: SearchResult) => {
    if (result.type !== 'note') {
      addRecentlyViewed(result.type as any, result.id);
    }
    navigate(result.url);
    onClose();
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'item':
        return <Sword className="w-4 h-4 text-amber-400" />;
      case 'enemy':
        return <Skull className="w-4 h-4 text-red-400" />;
      case 'recipe':
        return <Hammer className="w-4 h-4 text-blue-400" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-[#a3b18a]" />;
      case 'quest':
        return <Scroll className="w-4 h-4 text-amber-500" />;
      case 'note':
        return <FileText className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <div className="flex flex-col -m-5">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-charcoal-750 bg-charcoal-950">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm vật phẩm, quái vật, công thức, địa điểm, nhiệm vụ..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono text-slate-400 bg-charcoal-800 border border-charcoal-700 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-charcoal-850">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
              Nhập từ khóa để tra cứu dữ liệu game hoặc ghi chú cá nhân...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Không tìm thấy kết quả nào phù hợp với "{query}".
            </div>
          ) : (
            results.map((res) => (
              <div
                key={`${res.type}_${res.id}`}
                onClick={() => handleSelect(res)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-charcoal-800/80 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded bg-charcoal-950 border border-charcoal-800 shrink-0">
                    {getIcon(res.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm truncate group-hover:text-amber-400">
                        {res.title}
                      </span>
                      {res.badge && (
                        <Badge size="sm" variant="charcoal">
                          {res.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{res.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>

        {/* Quick jump footer */}
        <div className="px-4 py-2.5 bg-charcoal-950/80 border-t border-charcoal-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Gợi ý: Tìm "Cleaver", "Frenzied", "Bunker", "Gỗ", hoặc "Machete"</span>
          <span className="flex items-center gap-1 text-slate-400">
            Enter để chọn <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Modal>
  );
};
