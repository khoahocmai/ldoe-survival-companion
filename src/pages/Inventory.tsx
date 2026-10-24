import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '../context/DataContext';
import { usePersonalData } from '../hooks/usePersonalData';
import { WeaponInstance } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/common/SearchInput';
import { Modal } from '../components/common/Modal';
import {
  Package,
  Sword,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Layers,
  Calculator,
  ShieldAlert,
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { db } = useGameData();
  const {
    inventory,
    setInventoryItem,
    adjustInventoryItem,
    weaponInstances,
    addWeaponInstance,
    updateWeaponInstance,
    removeWeaponInstance,
  } = usePersonalData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'items' | 'weapons'>('items');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Add Item to Inventory Modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedNewItemId, setSelectedNewItemId] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);

  // Weapon Instance Modal
  const [isWeaponModalOpen, setIsWeaponModalOpen] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState<WeaponInstance | null>(null);
  const [weaponItemId, setWeaponItemId] = useState('glock_17');
  const [durabilityPercent, setDurabilityPercent] = useState(100);
  const [weaponNotes, setWeaponNotes] = useState('');

  const weaponsList = useMemo(() => {
    if (!db) return [];
    return db.items.filter((i) => !!i.weaponStats);
  }, [db]);

  // Inventory entries
  const inventoryEntries = useMemo(() => {
    return Object.entries(inventory)
      .map(([itemId, quantity]) => {
        const item = db?.itemsMap.get(itemId);
        return {
          itemId,
          item,
          name: item?.name || itemId,
          vietnameseName: item?.vietnameseName,
          category: item?.category || 'resource_raw',
          quantity,
        };
      })
      .filter((entry) => {
        if (categoryFilter !== 'all') {
          if (categoryFilter === 'weapons' && !entry.category.startsWith('weapon_')) return false;
          if (categoryFilter === 'resources' && !entry.category.startsWith('resource_')) return false;
          if (categoryFilter === 'medical' && entry.category !== 'medical' && entry.category !== 'food') return false;
          if (categoryFilter === 'components' && entry.category !== 'component' && entry.category !== 'special') return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = entry.name.toLowerCase().includes(q);
          const matchVn = entry.vietnameseName?.toLowerCase().includes(q);
          const matchId = entry.itemId.toLowerCase().includes(q);
          if (!matchName && !matchVn && !matchId) return false;
        }
        return true;
      });
  }, [inventory, db, categoryFilter, search]);

  const handleOpenAddWeapon = (instance?: WeaponInstance) => {
    if (instance) {
      setEditingWeapon(instance);
      setWeaponItemId(instance.itemId);
      setDurabilityPercent(instance.durabilityPercent);
      setWeaponNotes(instance.notes || '');
    } else {
      setEditingWeapon(null);
      setWeaponItemId(weaponsList[0]?.id || 'glock_17');
      setDurabilityPercent(100);
      setWeaponNotes('');
    }
    setIsWeaponModalOpen(true);
  };

  const handleSaveWeapon = () => {
    if (editingWeapon) {
      updateWeaponInstance(editingWeapon.id, {
        itemId: weaponItemId,
        durabilityPercent,
        notes: weaponNotes,
      });
    } else {
      addWeaponInstance({
        itemId: weaponItemId,
        durabilityPercent,
        notes: weaponNotes,
      });
    }
    setIsWeaponModalOpen(false);
  };

  const handleSaveNewItem = () => {
    if (!selectedNewItemId) return;
    adjustInventoryItem(selectedNewItemId, newQuantity);
    setIsAddItemOpen(false);
    setSelectedNewItemId('');
    setNewQuantity(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            Quản lý kho đồ sinh tồn (Inventory)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Theo dõi số lượng vật phẩm, quản lý độ bền từng khẩu súng/vũ khí và tự động đồng bộ sang Crafting Planner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'items' ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddItemOpen(true)}
            >
              Thêm vật phẩm vào kho
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenAddWeapon()}
            >
              Thêm vũ khí mới
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-charcoal-800 pb-2">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'items'
              ? 'bg-amber-600 text-charcoal-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Kho tài nguyên & trang bị ({Object.keys(inventory).length})
        </button>
        <button
          onClick={() => setActiveTab('weapons')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'weapons'
              ? 'bg-amber-600 text-charcoal-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sword className="w-4 h-4" />
          Độ bền từng vũ khí ({weaponInstances.length})
        </button>
      </div>

      {/* TAB 1: Resources & General Inventory */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm kiếm trong kho (gỗ, sắt, da, băng gạc...)"
              className="flex-1"
            />
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'resources', label: 'Tài nguyên' },
                { id: 'components', label: 'Linh kiện' },
                { id: 'medical', label: 'Y tế / Ăn uống' },
                { id: 'weapons', label: 'Vũ khí' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-charcoal-750 text-amber-400 border border-amber-500/40 font-bold'
                      : 'bg-charcoal-900 text-slate-400 hover:text-slate-200 border border-charcoal-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {inventoryEntries.length === 0 ? (
            <Card className="text-center py-12 text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="text-sm">Không có vật phẩm nào trong kho phù hợp với bộ lọc.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsAddItemOpen(true)}
              >
                Thêm vật phẩm vào kho
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {inventoryEntries.map((entry) => (
                <Card key={entry.itemId} className="flex flex-col justify-between p-3.5">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-200 text-sm truncate">
                          {entry.name}
                        </h4>
                        {entry.vietnameseName && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {entry.vietnameseName}
                          </p>
                        )}
                      </div>
                      <Badge size="sm" variant="charcoal">
                        {entry.category.split('_')[0]}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between py-2 border-y border-charcoal-800/60 my-2 font-mono">
                      <span className="text-xs text-slate-500">Số lượng:</span>
                      <span className="text-xl font-bold text-amber-400">{entry.quantity}</span>
                    </div>
                  </div>

                  {/* Increment/Decrement Buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustInventoryItem(entry.itemId, -10)}
                        className="px-1.5 py-1 text-[11px] font-mono bg-charcoal-950 hover:bg-charcoal-800 border border-charcoal-800 rounded text-slate-400"
                        title="Trừ 10"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => adjustInventoryItem(entry.itemId, -1)}
                        className="p-1 bg-charcoal-950 hover:bg-charcoal-800 border border-charcoal-800 rounded text-slate-400"
                        title="Trừ 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => adjustInventoryItem(entry.itemId, 1)}
                        className="p-1 bg-charcoal-950 hover:bg-charcoal-800 border border-charcoal-800 rounded text-slate-400"
                        title="Cộng 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => adjustInventoryItem(entry.itemId, 10)}
                        className="px-1.5 py-1 text-[11px] font-mono bg-charcoal-950 hover:bg-charcoal-800 border border-charcoal-800 rounded text-slate-400"
                        title="Cộng 10"
                      >
                        +10
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {db?.recipesByOutputMap.has(entry.itemId) && (
                        <button
                          onClick={() => navigate(`/planner?item=${entry.itemId}`)}
                          className="p-1 text-slate-400 hover:text-amber-400"
                          title="Lên kế hoạch chế tạo"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setInventoryItem(entry.itemId, 0)}
                        className="p-1 text-slate-500 hover:text-red-400"
                        title="Xóa khỏi kho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Weapon Instances with Individual Durability */}
      {activeTab === 'weapons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Quản lý từng khẩu súng và vũ khí riêng biệt theo tỷ lệ % độ bền còn lại.
            </p>
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenAddWeapon()}
            >
              Thêm vũ khí mới
            </Button>
          </div>

          {weaponInstances.length === 0 ? (
            <Card className="text-center py-12 text-slate-500">
              <Sword className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="text-sm">Chưa có khẩu súng hay vũ khí nào được lưu riêng.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => handleOpenAddWeapon()}
              >
                Thêm vũ khí đầu tiên
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weaponInstances.map((instance) => {
                const weapon = db?.itemsMap.get(instance.itemId);
                const maxDurability = weapon?.weaponStats?.durability || 100;
                const remainingHits = Math.floor((instance.durabilityPercent / 100) * maxDurability);

                return (
                  <Card key={instance.id} className="flex flex-col justify-between p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-slate-200 text-base">
                            {weapon?.name || instance.itemId}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono">
                            {weapon?.weaponStats?.isFirearm ? 'Súng ngắn / trường' : 'Vũ khí cận chiến'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenAddWeapon(instance)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeWeaponInstance(instance.id)}
                            className="p-1 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Durability Bar */}
                      <div className="space-y-1.5 my-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Độ bền còn lại:</span>
                          <span className="text-amber-400 font-bold">
                            {instance.durabilityPercent}% ({remainingHits}/{maxDurability} đòn)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-charcoal-950 rounded-full overflow-hidden border border-charcoal-800">
                          <div
                            className={`h-full transition-all ${
                              instance.durabilityPercent > 50
                                ? 'bg-emerald-500'
                                : instance.durabilityPercent > 20
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${instance.durabilityPercent}%` }}
                          />
                        </div>
                      </div>

                      {instance.notes && (
                        <p className="text-xs text-slate-400 italic bg-charcoal-950 p-2 rounded border border-charcoal-800">
                          "{instance.notes}"
                        </p>
                      )}
                    </div>

                    {/* Quick Calculator link */}
                    <div className="pt-2 border-t border-charcoal-800 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Calculator className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/combat?weapon=${instance.itemId}`)}
                        className="text-amber-400 hover:text-amber-300 text-xs w-full justify-center"
                      >
                        Đưa vào máy tính chiến đấu
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add General Item to Inventory */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Thêm vật phẩm vào kho đồ"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Chọn vật phẩm:
            </label>
            <select
              value={selectedNewItemId}
              onChange={(e) => setSelectedNewItemId(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              <option value="">-- Chọn một vật phẩm --</option>
              {db?.items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Số lượng thêm vào:
            </label>
            <input
              type="number"
              min="1"
              max="9999"
              value={newQuantity}
              onChange={(e) => setNewQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-800">
            <Button variant="secondary" onClick={() => setIsAddItemOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!selectedNewItemId}
              onClick={handleSaveNewItem}
            >
              Lưu vào kho
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add / Edit Weapon Instance */}
      <Modal
        isOpen={isWeaponModalOpen}
        onClose={() => setIsWeaponModalOpen(false)}
        title={editingWeapon ? 'Chỉnh sửa vũ khí' : 'Thêm vũ khí mới vào kho'}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Loại vũ khí:
            </label>
            <select
              value={weaponItemId}
              onChange={(e) => setWeaponItemId(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              {weaponsList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Độ bền tối đa: {w.weaponStats?.durability} hits)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400">Độ bền còn lại:</span>
              <span className="text-amber-400 font-bold">{durabilityPercent}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={durabilityPercent}
              onChange={(e) => setDurabilityPercent(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Ghi chú vũ khí này (tùy chọn):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Để dành đi hầm ngầm Alfa, gần gãy..."
              value={weaponNotes}
              onChange={(e) => setWeaponNotes(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-800">
            <Button variant="secondary" onClick={() => setIsWeaponModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSaveWeapon}>
              Lưu vũ khí
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
