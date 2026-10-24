import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGameData } from '../../context/DataContext';
import { usePersonalData } from '../../hooks/usePersonalData';
import { Item, ItemCategory } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import {
  Sword,
  Shield,
  Layers,
  Heart,
  Wrench,
  Star,
  Calculator,
  ChevronRight,
  ExternalLink,
  Package,
} from 'lucide-react';

export const ItemsPage: React.FC = () => {
  const { db } = useGameData();
  const { isFavorite, toggleFavorite, inventory, adjustInventoryItem } = usePersonalData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Sync selected item with URL query parameter ?select=...
  const selectId = searchParams.get('select');
  React.useEffect(() => {
    if (selectId && db) {
      const item = db.itemsMap.get(selectId);
      if (item) setSelectedItem(item);
    }
  }, [selectId, db]);

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'weapons', label: 'Vũ khí' },
    { id: 'armor', label: 'Giáp bảo hộ' },
    { id: 'resources', label: 'Tài nguyên' },
    { id: 'medical', label: 'Y tế & Thức ăn' },
    { id: 'components', label: 'Linh kiện' },
  ];

  const filteredItems = useMemo(() => {
    if (!db) return [];
    return db.items.filter((item) => {
      // Category filter
      if (selectedCategory === 'weapons') {
        if (!item.category.startsWith('weapon_')) return false;
      } else if (selectedCategory === 'armor') {
        if (!item.category.startsWith('armor_')) return false;
      } else if (selectedCategory === 'resources') {
        if (!item.category.startsWith('resource_')) return false;
      } else if (selectedCategory === 'medical') {
        if (item.category !== 'medical' && item.category !== 'food') return false;
      } else if (selectedCategory === 'components') {
        if (item.category !== 'component' && item.category !== 'special') return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchVn = item.vietnameseName?.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        if (!matchName && !matchVn && !matchId) return false;
      }

      return true;
    });
  }, [db, selectedCategory, search]);

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setSearchParams({ select: item.id });
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSearchParams({});
  };

  const getRarityBadgeVariant = (rarity: Item['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'amber';
      case 'epic':
        return 'blue';
      case 'rare':
        return 'olive';
      default:
        return 'charcoal';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sword className="w-6 h-6 text-amber-500" />
            Vật phẩm & Trang bị
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Tra cứu vũ khí, giáp, nguyên vật liệu và thông số chiến thuật trong LDoE.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-charcoal-900 border border-charcoal-800 px-3 py-1.5 rounded-lg w-fit">
          Tổng số: <span className="text-amber-400 font-bold">{filteredItems.length}</span> vật phẩm
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm tên vật phẩm (Spear, Cleaver, Gỗ, Sắt...)"
          className="flex-1"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-charcoal-950 font-bold'
                  : 'bg-charcoal-900 text-slate-400 hover:text-slate-200 border border-charcoal-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const favorite = isFavorite('item', item.id);
          const inStock = inventory[item.id] || 0;

          return (
            <Card
              key={item.id}
              hoverable
              onClick={() => handleSelectItem(item)}
              className="flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                      {item.name}
                    </h3>
                    {item.vietnameseName && (
                      <p className="text-xs text-slate-400 truncate">{item.vietnameseName}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite('item', item.id);
                    }}
                    className={`p-1.5 rounded hover:bg-charcoal-800 transition-colors shrink-0 ${
                      favorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <Badge size="sm" variant={getRarityBadgeVariant(item.rarity)}>
                    {item.rarity}
                  </Badge>
                  {item.weaponStats && (
                    <Badge size="sm" variant="amber">
                      {item.weaponStats.isFirearm ? 'Súng' : 'Cận chiến'}
                    </Badge>
                  )}
                  {item.armorStats && (
                    <Badge size="sm" variant="blue">
                      Giáp +{item.armorStats.armorValue}
                    </Badge>
                  )}
                  {item.consumableStats?.healHp && (
                    <Badge size="sm" variant="olive">
                      +{item.consumableStats.healHp} HP
                    </Badge>
                  )}
                </div>

                {/* Quick stats snapshot */}
                {item.weaponStats && (
                  <div className="grid grid-cols-3 gap-1 bg-charcoal-950 p-2 rounded border border-charcoal-800 text-[11px] font-mono mb-3">
                    <div>
                      <span className="text-slate-500 block">S.Thương</span>
                      <span className="text-amber-400 font-bold">{item.weaponStats.damage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tốc độ</span>
                      <span className="text-slate-200">{item.weaponStats.attackSpeed}/s</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Độ bền</span>
                      <span className="text-slate-200">{item.weaponStats.durability}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{item.description}</p>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-charcoal-800 text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kho: </span>
                  <span className={inStock > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {inStock}
                  </span>
                </span>
                <span className="flex items-center text-amber-500/80 group-hover:text-amber-400">
                  Chi tiết <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={handleCloseModal}
          title={
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">{selectedItem.name}</span>
              {selectedItem.vietnameseName && (
                <span className="text-xs font-normal text-slate-400">
                  ({selectedItem.vietnameseName})
                </span>
              )}
            </div>
          }
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Badges & Verification Status */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getRarityBadgeVariant(selectedItem.rarity)}>
                {selectedItem.rarity}
              </Badge>
              <Badge variant="charcoal">{selectedItem.category}</Badge>
              <Badge variant="olive">
                {selectedItem.verificationStatus === 'verified' ? 'Đã xác minh' : 'Chưa xác minh'}
              </Badge>
              {selectedItem.source && (
                <span className="text-[11px] font-mono text-slate-500">
                  Nguồn: {selectedItem.source}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 bg-charcoal-950 p-3 rounded-lg border border-charcoal-800 leading-relaxed">
              {selectedItem.description}
            </p>

            {/* Weapon Detailed Stats */}
            {selectedItem.weaponStats && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold">
                  THÔNG SỐ TÁC CHIẾN
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-sm">
                  <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                    <span className="text-xs text-slate-500 block">Sát thương cơ bản</span>
                    <span className="text-lg font-bold text-amber-400">
                      {selectedItem.weaponStats.damage}
                    </span>
                  </div>
                  <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                    <span className="text-xs text-slate-500 block">Tốc độ đánh</span>
                    <span className="text-lg font-bold text-slate-200">
                      {selectedItem.weaponStats.attackSpeed} /s
                    </span>
                  </div>
                  <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                    <span className="text-xs text-slate-500 block">Độ bền tối đa</span>
                    <span className="text-lg font-bold text-slate-200">
                      {selectedItem.weaponStats.durability} đòn
                    </span>
                  </div>
                  <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                    <span className="text-xs text-slate-500 block">Sneak Sát thương</span>
                    <span className="text-lg font-bold text-red-400">
                      {selectedItem.weaponStats.damage * (selectedItem.weaponStats.sneakMultiplier || 3)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Armor Detailed Stats */}
            {selectedItem.armorStats && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
                  THÔNG SỐ PHÒNG THỦ
                </h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                    <span className="text-xs text-slate-500 block">Chỉ số giáp</span>
                    <span className="text-lg font-bold text-blue-400">
                      +{selectedItem.armorStats.armorValue}
                    </span>
                  </div>
                  <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                    <span className="text-xs text-slate-500 block">Độ bền giáp</span>
                    <span className="text-lg font-bold text-slate-200">
                      {selectedItem.armorStats.durability}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Consumable Stats */}
            {selectedItem.consumableStats && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  HIỆU QUẢ SỬ DỤNG
                </h4>
                <div className="bg-charcoal-950 p-3 rounded border border-charcoal-800 text-sm">
                  {selectedItem.consumableStats.healHp && (
                    <div className="text-emerald-400 font-bold">
                      Hồi phục HP: +{selectedItem.consumableStats.healHp} máu
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Related Recipes & Crafting */}
            {db && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  CÔNG THỨC CHẾ TẠO LIÊN QUAN
                </h4>
                {db.recipesByOutputMap.get(selectedItem.id)?.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-charcoal-950 p-3 rounded border border-charcoal-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        {recipe.workstation || 'Chế tạo thủ công'} (Cần cấp{' '}
                        {recipe.levelRequired || 1})
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {recipe.ingredients.map((ing) => {
                          const ingItem = db.itemsMap.get(ing.itemId);
                          return (
                            <span
                              key={ing.itemId}
                              className="text-xs font-mono text-slate-400 bg-charcoal-900 px-2 py-0.5 rounded border border-charcoal-800"
                            >
                              {ingItem?.name || ing.itemId}:{' '}
                              <span className="text-amber-400 font-bold">{ing.quantity}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleCloseModal();
                        navigate(`/planner?item=${selectedItem.id}`);
                      }}
                    >
                      Lên kế hoạch
                    </Button>
                  </div>
                ))}
                {!db.recipesByOutputMap.has(selectedItem.id) && (
                  <p className="text-xs text-slate-500 italic">
                    Vật phẩm này không thể tự chế tạo (tìm thấy trong hòm loot, sự kiện hoặc đổi vé).
                  </p>
                )}
              </div>
            )}

            {/* Inventory Quick Adjust */}
            <div className="flex items-center justify-between p-3 rounded bg-charcoal-950 border border-charcoal-800 text-sm">
              <span className="text-slate-400 font-medium">Số lượng trong kho của bạn:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => adjustInventoryItem(selectedItem.id, -1)}
                  disabled={(inventory[selectedItem.id] || 0) <= 0}
                >
                  -1
                </Button>
                <span className="w-12 text-center font-mono font-bold text-amber-400">
                  {inventory[selectedItem.id] || 0}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => adjustInventoryItem(selectedItem.id, 1)}
                >
                  +1
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => adjustInventoryItem(selectedItem.id, 10)}
                >
                  +10
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-800">
              {selectedItem.weaponStats && (
                <Button
                  variant="primary"
                  icon={<Calculator className="w-4 h-4" />}
                  onClick={() => {
                    handleCloseModal();
                    navigate(`/combat?weapon=${selectedItem.id}`);
                  }}
                >
                  Tính toán chiến đấu
                </Button>
              )}
              {db?.recipesByOutputMap.has(selectedItem.id) && (
                <Button
                  variant="secondary"
                  icon={<Layers className="w-4 h-4" />}
                  onClick={() => {
                    handleCloseModal();
                    navigate(`/planner?item=${selectedItem.id}`);
                  }}
                >
                  Lên kế hoạch chế tạo
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
