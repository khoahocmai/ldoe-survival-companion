import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Calculator,
  Layers,
  Sparkles,
  RotateCcw,
  Sword,
  ChevronRight,
  Shield,
  Zap,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { Item, WeaponMod, WeaponModSlot } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EntityImage } from '../../components/common/EntityImage';
import { Callout, EmptyState, PageHeader, Section } from '../../components/common/Layout';
import { FormModal, FormRow } from '../../components/common/FormModal';
import { Field, NumberInput, Select, TextInput, Textarea } from '../../components/common/Field';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { storageService } from '../../services/storageService';
import {
  WEAPON_MOD_SLOT_LABEL,
  WEAPON_MOD_RARITY_LABEL,
  WEAPON_MOD_RARITY_TONE,
} from '../../lib/labels';
import { calculateModdedStats, aggregateModMaterials } from '../../lib/calculators/weaponModCalculator';

type WeaponCategoryFilter = 'all' | 'melee' | 'firearm';

export const WeaponModsPage: React.FC = () => {
  const { db, reload } = useGameData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // All weapons, prioritizing those with mods first
  const moddableWeapons = useMemo(() => {
    if (!db) return [];
    return db.items
      .filter((item) => !!item.weaponStats)
      .sort((a, b) => {
        const countA = db.weaponModsByWeaponIdMap.get(a.id)?.length ?? 0;
        const countB = db.weaponModsByWeaponIdMap.get(b.id)?.length ?? 0;
        if ((countA > 0) !== (countB > 0)) return countB - countA;
        return a.name.localeCompare(b.name);
      });
  }, [db]);

  const [categoryFilter, setCategoryFilter] = useState<WeaponCategoryFilter>('all');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('');
  const [selectedModsBySlot, setSelectedModsBySlot] = useState<Record<string, string | null>>({});

  // Mod editing / creating state
  const [editingMod, setEditingMod] = useState<Partial<WeaponMod> | null>(null);
  const [isNewMod, setIsNewMod] = useState(false);
  const [deletingModId, setDeletingModId] = useState<string | null>(null);

  // Sync with URL search params ?weapon=...
  useEffect(() => {
    if (!db || moddableWeapons.length === 0) return;
    const weaponParam = searchParams.get('weapon');
    if (weaponParam && moddableWeapons.some((w) => w.id === weaponParam)) {
      setSelectedWeaponId(weaponParam);
    } else if (!selectedWeaponId) {
      setSelectedWeaponId(moddableWeapons[0].id);
    }
  }, [searchParams, db, moddableWeapons, selectedWeaponId]);

  // Current selected weapon object
  const currentWeapon = useMemo(() => {
    return db?.itemsMap.get(selectedWeaponId) ?? moddableWeapons[0];
  }, [db, selectedWeaponId, moddableWeapons]);

  // Available mods for the current selected weapon
  const availableMods = useMemo(() => {
    if (!db || !currentWeapon) return [];
    return db.weaponModsByWeaponIdMap.get(currentWeapon.id) ?? [];
  }, [db, currentWeapon]);

  // Unique slots for this weapon
  const weaponSlots = useMemo(() => {
    const set = new Set<WeaponModSlot>();
    for (const mod of availableMods) {
      set.add(mod.slot);
    }
    // If no mods exist yet, show standard default slots for its category
    if (set.size === 0 && currentWeapon) {
      if (currentWeapon.category === 'weapon_melee') {
        set.add('blade');
        set.add('handle');
      } else {
        set.add('muzzle');
        set.add('magazine');
        set.add('sight');
      }
    }
    return Array.from(set);
  }, [availableMods, currentWeapon]);

  // Filtered weapon list based on category
  const filteredWeapons = useMemo(() => {
    return moddableWeapons.filter((w) => {
      if (categoryFilter === 'melee') return w.category === 'weapon_melee';
      if (categoryFilter === 'firearm') return w.category === 'weapon_firearm';
      return true;
    });
  }, [moddableWeapons, categoryFilter]);

  // Change selected weapon
  const handleSelectWeapon = (weaponId: string) => {
    setSelectedWeaponId(weaponId);
    setSelectedModsBySlot({});
    setSearchParams({ weapon: weaponId }, { replace: true });
  };

  // Toggle or select a mod in a slot
  const handleSelectMod = (slot: WeaponModSlot, modId: string) => {
    setSelectedModsBySlot((prev) => ({
      ...prev,
      [slot]: prev[slot] === modId ? null : modId,
    }));
  };

  // Apply Meta Combo automatically
  const handleApplyMeta = () => {
    if (!availableMods.length) return;
    const metaSelection: Record<string, string | null> = {};
    for (const slot of weaponSlots) {
      const slotMods = availableMods.filter((m) => m.slot === slot);
      const sorted = [...slotMods].sort((a, b) => {
        const rarityScore = (r: string) => (r === 'extremely_rare' ? 3 : r === 'rare' ? 2 : 1);
        if (rarityScore(b.rarity) !== rarityScore(a.rarity)) {
          return rarityScore(b.rarity) - rarityScore(a.rarity);
        }
        return (b.stats.damage ?? 0) - (a.stats.damage ?? 0);
      });
      if (sorted[0]) {
        metaSelection[slot] = sorted[0].id;
      }
    }
    setSelectedModsBySlot(metaSelection);
  };

  // Reset all installed mods
  const handleResetMods = () => {
    setSelectedModsBySlot({});
  };

  // List of currently selected WeaponMod objects
  const equippedModsList = useMemo(() => {
    if (!db) return [];
    const list: WeaponMod[] = [];
    for (const modId of Object.values(selectedModsBySlot)) {
      if (modId) {
        const mod = db.weaponModsMap.get(modId);
        if (mod) list.push(mod);
      }
    }
    return list;
  }, [db, selectedModsBySlot]);

  // Calculate modded stats
  const moddedStats = useMemo(() => {
    if (!currentWeapon) return null;
    return calculateModdedStats(currentWeapon, equippedModsList);
  }, [currentWeapon, equippedModsList]);

  // Aggregate required materials
  const requiredMaterials = useMemo(() => {
    return aggregateModMaterials(equippedModsList, db?.itemsMap);
  }, [equippedModsList, db]);

  // Action: navigate to combat calculator with customDamage
  const handleGoToCombat = () => {
    if (!currentWeapon || !moddedStats) return;
    navigate(`/combat?weapon=${currentWeapon.id}&customDamage=${moddedStats.damage}`);
  };

  // Action: navigate to planner with required materials
  const handleGoToPlanner = () => {
    if (requiredMaterials.length === 0) return;
    const encoded = requiredMaterials.map((m) => `${m.itemId}:${m.quantity}`).join(',');
    navigate(`/planner?materials=${encodeURIComponent(encoded)}&title=${encodeURIComponent(`Bản độ ${currentWeapon?.name ?? ''}`)}`);
  };

  // Open modal to add a brand new mod
  const openNewModModal = (defaultSlot?: WeaponModSlot) => {
    if (!currentWeapon) return;
    setIsNewMod(true);
    setEditingMod({
      id: `mod_${currentWeapon.id}_custom_${Date.now()}`,
      weaponId: currentWeapon.id,
      slot: defaultSlot ?? (weaponSlots[0] || 'blade'),
      name: '',
      vietnameseName: '',
      rarity: 'common',
      stats: { damage: 2 },
      materials: [{ itemId: 'iron_bar', quantity: 5 }],
      obtainDescription: '',
      description: '',
    });
  };

  // Open modal to edit an existing mod
  const openEditModModal = (mod: WeaponMod, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNewMod(false);
    setEditingMod({ ...mod });
  };

  // Open confirm dialog to delete a mod
  const openDeleteConfirm = (modId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingModId(modId);
  };

  // Save mod to storageService and reload
  const handleSaveMod = async () => {
    if (!editingMod?.name?.trim() || !editingMod?.id?.trim() || !editingMod?.weaponId) return;
    const entity: WeaponMod = {
      id: editingMod.id.trim(),
      weaponId: editingMod.weaponId,
      slot: editingMod.slot ?? 'blade',
      name: editingMod.name.trim(),
      vietnameseName: editingMod.vietnameseName?.trim() || editingMod.name.trim(),
      rarity: editingMod.rarity ?? 'common',
      stats: editingMod.stats ?? {},
      activeSkill: editingMod.activeSkill?.trim() || undefined,
      materials: (editingMod.materials ?? []).filter((m) => m.itemId && m.quantity > 0),
      obtainDescription: editingMod.obtainDescription?.trim() || undefined,
      description: editingMod.description?.trim() || undefined,
      isCustom: true,
    };
    storageService.saveEntity('customWeaponMods', entity);
    await reload();
    setEditingMod(null);
  };

  // Delete mod from storageService and reload
  const handleConfirmDelete = async () => {
    if (!deletingModId) return;
    storageService.deleteOrHideEntity('customWeaponMods', deletingModId);
    await reload();
    setDeletingModId(null);
  };

  if (!db || !currentWeapon || !moddedStats) {
    return (
      <div className="py-12">
        <EmptyState title="Đang tải dữ liệu bản độ vũ khí..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bàn độ vũ khí (Gunsmith Bench)"
        description="Lắp ráp các bản độ meta, cập nhật chỉ số và tổng hợp nguyên liệu chế tạo."
        icon={<Wrench />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus />}
              onClick={() => openNewModModal()}
            >
              Thêm bản độ
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles />}
              onClick={handleApplyMeta}
              disabled={availableMods.length === 0}
            >
              Gợi ý Meta
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw />}
              onClick={handleResetMods}
              disabled={equippedModsList.length === 0}
            >
              Tháo hết
            </Button>
          </div>
        }
      />

      {/* 1. Weapon Selector */}
      <Card className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">1. Chọn vũ khí nâng cấp</h2>
            <p className="text-xs text-muted">Chọn vũ khí để mở các vị trí (Slot) lắp ráp linh kiện</p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-subtle p-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                categoryFilter === 'all' ? 'bg-bg text-fg shadow-sm' : 'text-muted hover:text-fg'
              }`}
            >
              Tất cả ({moddableWeapons.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('melee')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                categoryFilter === 'melee' ? 'bg-bg text-fg shadow-sm' : 'text-muted hover:text-fg'
              }`}
            >
              Cận chiến
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('firearm')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                categoryFilter === 'firearm' ? 'bg-bg text-fg shadow-sm' : 'text-muted hover:text-fg'
              }`}
            >
              Súng
            </button>
          </div>
        </div>

        {/* Weapons Carousel / Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-7">
          {filteredWeapons.map((w) => {
            const isSelected = w.id === currentWeapon.id;
            const modsCount = db.weaponModsByWeaponIdMap.get(w.id)?.length ?? 0;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => handleSelectWeapon(w.id)}
                className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${
                  isSelected
                    ? 'border-accent bg-accent-soft text-fg ring-2 ring-accent/30'
                    : 'border-line bg-card hover:border-line-focus hover:bg-subtle text-muted'
                }`}
              >
                <div className="mb-2 h-14 w-14 shrink-0">
                  <EntityImage
                    folder="items"
                    id={w.id}
                    image={w.image}
                    alt={w.name}
                  />
                </div>
                <span className="line-clamp-1 text-xs font-semibold text-fg">{w.name}</span>
                <span className="line-clamp-1 text-[11px] text-muted">{w.vietnameseName || w.name}</span>
                <span className="mt-1 text-[10px] text-accent font-medium">
                  {modsCount > 0 ? `${modsCount} bản mod` : 'Chưa có mod'}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Grid: Left is Mod Slots, Right is Stats & Total Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Slot Mod Builder (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              2. Bàn lắp ráp linh kiện ({equippedModsList.length}/{weaponSlots.length} slot đã lắp)
            </h2>
            <Link to={`/wiki/items?select=${currentWeapon.id}`} className="text-xs text-accent hover:underline flex items-center gap-1">
              Xem trong Vật phẩm <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {availableMods.length === 0 && (
            <Card className="text-center py-8 space-y-3">
              <p className="text-sm text-muted">
                Vũ khí <strong>{currentWeapon.name}</strong> chưa có bản độ nào trong dữ liệu.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus />}
                onClick={() => openNewModModal()}
              >
                Thêm bản độ đầu tiên cho {currentWeapon.name}
              </Button>
            </Card>
          )}

          {weaponSlots.map((slot) => {
            const slotMods = availableMods.filter((m) => m.slot === slot);
            const activeModId = selectedModsBySlot[slot];
            const activeMod = activeModId ? db.weaponModsMap.get(activeModId) : null;

            return (
              <Card key={slot} className="space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-xs font-semibold text-accent">
                      <Wrench className="h-3.5 w-3.5" />
                    </span>
                    <h3 className="text-sm font-semibold text-fg">
                      Slot: {WEAPON_MOD_SLOT_LABEL[slot] || slot}
                    </h3>
                  </div>

                  {activeMod ? (
                    <div className="flex items-center gap-2">
                      <Badge tone={WEAPON_MOD_RARITY_TONE[activeMod.rarity]}>
                        {activeMod.name}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleSelectMod(slot, activeMod.id)}
                        className="text-xs text-muted hover:text-danger"
                      >
                        Tháo
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Chưa lắp mod</span>
                  )}
                </div>

                {/* Available Mod Cards for this Slot */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {slotMods.map((mod) => {
                    const isEquipped = activeModId === mod.id;
                    const tone = WEAPON_MOD_RARITY_TONE[mod.rarity];

                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleSelectMod(slot, mod.id)}
                        className={`cursor-pointer rounded-xl border p-3 transition flex flex-col justify-between ${
                          isEquipped
                            ? 'border-accent bg-accent-soft/40 ring-2 ring-accent/30'
                            : 'border-line bg-card/60 hover:border-line-focus hover:bg-subtle'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <div>
                              <h4 className="text-sm font-semibold text-fg leading-tight">{mod.name}</h4>
                              <p className="text-xs text-muted leading-tight">{mod.vietnameseName}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge tone={tone} size="sm">
                                {WEAPON_MOD_RARITY_LABEL[mod.rarity]}
                              </Badge>
                              <button
                                type="button"
                                title="Sửa bản độ"
                                onClick={(e) => openEditModModal(mod, e)}
                                className="p-1 rounded hover:bg-subtle text-muted hover:text-fg transition"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                title="Xóa bản độ"
                                onClick={(e) => openDeleteConfirm(mod.id, e)}
                                className="p-1 rounded hover:bg-subtle text-muted hover:text-danger transition"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {mod.description && (
                            <p className="text-xs text-muted line-clamp-2 mb-2">{mod.description}</p>
                          )}

                          {/* Stats Delta List */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {typeof mod.stats.damage === 'number' && mod.stats.damage !== 0 && (
                              <span
                                className={`num inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                                  mod.stats.damage > 0 ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'
                                }`}
                              >
                                Sát thương {mod.stats.damage > 0 ? `+${mod.stats.damage}` : mod.stats.damage}
                              </span>
                            )}
                            {typeof mod.stats.attackSpeed === 'number' && mod.stats.attackSpeed !== 0 && (
                              <span
                                className={`num inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                                  mod.stats.attackSpeed > 0 ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'
                                }`}
                              >
                                Tốc đánh {mod.stats.attackSpeed > 0 ? `+${mod.stats.attackSpeed}` : mod.stats.attackSpeed}/s
                              </span>
                            )}
                            {typeof mod.stats.durability === 'number' && mod.stats.durability !== 0 && (
                              <span
                                className={`num inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                                  mod.stats.durability > 0 ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'
                                }`}
                              >
                                Độ bền {mod.stats.durability > 0 ? `+${mod.stats.durability}` : mod.stats.durability}
                              </span>
                            )}
                            {typeof mod.stats.critChance === 'number' && mod.stats.critChance !== 0 && (
                              <span className="num inline-flex items-center rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                                Chí mạng +{mod.stats.critChance}%
                              </span>
                            )}
                            {typeof mod.stats.critDamage === 'number' && mod.stats.critDamage !== 0 && (
                              <span className="num inline-flex items-center rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                                Dame chí mạng +{mod.stats.critDamage}%
                              </span>
                            )}
                            {typeof mod.stats.stability === 'number' && mod.stats.stability !== 0 && (
                              <span
                                className={`num inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                                  mod.stats.stability > 0 ? 'bg-info-soft text-info' : 'bg-danger-soft text-danger'
                                }`}
                              >
                                Độ ổn định {mod.stats.stability > 0 ? `+${mod.stats.stability}` : mod.stats.stability}
                              </span>
                            )}
                            {typeof mod.stats.noise === 'number' && mod.stats.noise !== 0 && (
                              <span
                                className={`num inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                                  mod.stats.noise < 0 ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'
                                }`}
                              >
                                Độ ồn {mod.stats.noise > 0 ? `+${mod.stats.noise}` : mod.stats.noise}%
                              </span>
                            )}
                          </div>

                          {/* Active Skill */}
                          {mod.activeSkill && (
                            <div className="rounded-lg bg-accent-soft/60 px-2 py-1 mb-2 text-xs font-semibold text-accent flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 shrink-0" />
                              <span className="line-clamp-1">{mod.activeSkill}</span>
                            </div>
                          )}
                        </div>

                        {/* Mod Materials & Obtain Source Footer */}
                        <div className="border-t border-line/60 pt-2 mt-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {mod.materials.map((mat) => {
                              const item = db.itemsMap.get(mat.itemId);
                              return (
                                <span
                                  key={mat.itemId}
                                  className="num inline-flex items-center gap-1 rounded bg-subtle px-1.5 py-0.5 text-[10px] text-muted font-medium"
                                >
                                  {item?.name || mat.itemId} ×{mat.quantity}
                                </span>
                              );
                            })}
                          </div>
                          {mod.obtainDescription && (
                            <p className="text-[10px] text-muted line-clamp-1">
                              Nguồn: {mod.obtainDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add mod shortcut for this specific slot */}
                <button
                  type="button"
                  onClick={() => openNewModModal(slot)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs text-muted hover:border-accent hover:text-accent transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm bản độ cho slot {WEAPON_MOD_SLOT_LABEL[slot] || slot}
                </button>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Total Stats & Smart Navigation Actions (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="sticky top-20 space-y-6">
            {/* Header: Selected Weapon Profile */}
            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-subtle p-1 border border-line">
                  <EntityImage
                    folder="items"
                    id={currentWeapon.id}
                    image={currentWeapon.image}
                    alt={currentWeapon.name}
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg">{currentWeapon.name}</h3>
                  <p className="text-xs text-muted">{currentWeapon.vietnameseName}</p>
                  <p className="text-xs text-accent mt-0.5 font-medium">
                    {equippedModsList.length} / {weaponSlots.length} bản độ đang lắp
                  </p>
                </div>
              </div>

              {/* Before & After Stats */}
              <Section title="Chỉ số vũ khí sau khi độ">
                <div className="divide-y divide-line rounded-xl border border-line bg-subtle/50 text-sm overflow-hidden">
                  {/* Damage */}
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted font-medium flex items-center gap-1.5">
                      <Sword className="h-4 w-4 text-accent" /> Sát thương
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="num text-muted">{moddedStats.baseDamage}</span>
                      <ChevronRight className="h-3 w-3 text-faint" />
                      <span className="num font-bold text-fg text-base">{moddedStats.damage}</span>
                      {moddedStats.damageDelta !== 0 && (
                        <span
                          className={`num text-xs font-semibold ${
                            moddedStats.damageDelta > 0 ? 'text-ok' : 'text-danger'
                          }`}
                        >
                          ({moddedStats.damageDelta > 0 ? `+${moddedStats.damageDelta}` : moddedStats.damageDelta})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attack Speed */}
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted font-medium flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-accent" /> Tốc độ đánh
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="num text-muted">{moddedStats.baseAttackSpeed}/s</span>
                      <ChevronRight className="h-3 w-3 text-faint" />
                      <span className="num font-bold text-fg text-base">{moddedStats.attackSpeed}/s</span>
                      {moddedStats.attackSpeedDelta !== 0 && (
                        <span
                          className={`num text-xs font-semibold ${
                            moddedStats.attackSpeedDelta > 0 ? 'text-ok' : 'text-danger'
                          }`}
                        >
                          ({moddedStats.attackSpeedDelta > 0 ? `+${moddedStats.attackSpeedDelta}` : moddedStats.attackSpeedDelta})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DPS */}
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted font-medium flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-accent" /> Sát thương/giây (DPS)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="num text-muted">{moddedStats.baseDps}</span>
                      <ChevronRight className="h-3 w-3 text-faint" />
                      <span className="num font-bold text-accent text-base">{moddedStats.dps}</span>
                      {moddedStats.dpsDelta !== 0 && (
                        <span
                          className={`num text-xs font-semibold ${
                            moddedStats.dpsDelta > 0 ? 'text-ok' : 'text-danger'
                          }`}
                        >
                          ({moddedStats.dpsDelta > 0 ? `+${moddedStats.dpsDelta}` : moddedStats.dpsDelta})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Durability */}
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted font-medium flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-accent" /> Độ bền đòn đánh
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="num text-muted">{moddedStats.baseDurability}</span>
                      <ChevronRight className="h-3 w-3 text-faint" />
                      <span className="num font-bold text-fg text-base">{moddedStats.durability}</span>
                      {moddedStats.durabilityDelta !== 0 && (
                        <span
                          className={`num text-xs font-semibold ${
                            moddedStats.durabilityDelta > 0 ? 'text-ok' : 'text-danger'
                          }`}
                        >
                          ({moddedStats.durabilityDelta > 0 ? `+${moddedStats.durabilityDelta}` : moddedStats.durabilityDelta})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Crit / Stability / Noise extras if any */}
                  {(moddedStats.critChance > 0 || moddedStats.stability !== 0 || moddedStats.noise !== 0) && (
                    <div className="p-3 bg-subtle/30 space-y-1.5 text-xs">
                      {moddedStats.critChance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted">Tỉ lệ bạo kích</span>
                          <span className="num font-semibold text-accent">+{moddedStats.critChance}%</span>
                        </div>
                      )}
                      {moddedStats.critDamage > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted">Sát thương bạo kích</span>
                          <span className="num font-semibold text-accent">+{moddedStats.critDamage}%</span>
                        </div>
                      )}
                      {moddedStats.stability !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted">Độ ổn định / Giảm giật</span>
                          <span className={`num font-semibold ${moddedStats.stability > 0 ? 'text-info' : 'text-danger'}`}>
                            {moddedStats.stability > 0 ? `+${moddedStats.stability}` : moddedStats.stability}
                          </span>
                        </div>
                      )}
                      {moddedStats.noise !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted">Mức ồn âm thanh</span>
                          <span className={`num font-semibold ${moddedStats.noise < 0 ? 'text-ok' : 'text-danger'}`}>
                            {moddedStats.noise > 0 ? `+${moddedStats.noise}` : moddedStats.noise}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Section>

              {/* Active skills */}
              {moddedStats.activeSkills.length > 0 && (
                <Callout tone="accent" icon={<Zap />}>
                  <div className="space-y-1">
                    <p className="font-semibold text-accent">Kỹ năng đặc biệt kích hoạt:</p>
                    <ul className="list-disc list-inside text-xs">
                      {moddedStats.activeSkills.map((sk) => (
                        <li key={sk}>{sk}</li>
                      ))}
                    </ul>
                  </div>
                </Callout>
              )}

              {/* Smart Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  block
                  icon={<Calculator />}
                  onClick={handleGoToCombat}
                >
                  Đưa vào máy tính chiến đấu (Dmg: {moddedStats.damage})
                </Button>
                <Button
                  variant="secondary"
                  block
                  icon={<Layers />}
                  onClick={handleGoToPlanner}
                  disabled={requiredMaterials.length === 0}
                >
                  Gom nguyên liệu sang Kế hoạch chế tạo ({requiredMaterials.length} loại)
                </Button>
              </div>
            </Card>

            {/* Total Required Materials Aggregate */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h4 className="text-sm font-semibold text-fg flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-accent" />
                  Tổng nguyên liệu chế tạo bộ mod
                </h4>
                <span className="text-xs text-muted font-medium">
                  {requiredMaterials.length} loại vật phẩm
                </span>
              </div>

              {requiredMaterials.length === 0 ? (
                <p className="text-xs text-muted py-2 text-center">
                  Chưa chọn bản mod nào cần nguyên liệu.
                </p>
              ) : (
                <div className="divide-y divide-line text-xs max-h-64 overflow-y-auto pr-1">
                  {requiredMaterials.map((mat) => {
                    const item = db.itemsMap.get(mat.itemId);
                    return (
                      <div key={mat.itemId} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-fg">
                            {item?.name || mat.itemId}
                          </span>
                          {item?.vietnameseName && (
                            <span className="text-muted text-[11px]">({item.vietnameseName})</span>
                          )}
                        </div>
                        <span className="num font-bold text-accent text-sm">
                          ×{mat.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Add / Edit Mod FormModal */}
      {editingMod && (
        <FormModal
          isOpen={Boolean(editingMod)}
          title={isNewMod ? 'Thêm bản độ vũ khí' : 'Sửa bản độ vũ khí'}
          onClose={() => setEditingMod(null)}
          onSave={handleSaveMod}
        >
          <FormRow>
            <Field label="Vũ khí áp dụng">
              <Select
                value={editingMod.weaponId}
                onChange={(e) => setEditingMod((prev) => ({ ...prev, weaponId: e.target.value }))}
              >
                {moddableWeapons.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.vietnameseName ? `(${w.vietnameseName})` : ''}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Vị trí lắp ráp (Slot)">
              <Select
                value={editingMod.slot}
                onChange={(e) => setEditingMod((prev) => ({ ...prev, slot: e.target.value as WeaponModSlot }))}
              >
                {Object.entries(WEAPON_MOD_SLOT_LABEL).map(([slotKey, slotName]) => (
                  <option key={slotKey} value={slotKey}>
                    {slotName}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Tên tiếng Anh">
              <TextInput
                value={editingMod.name ?? ''}
                onChange={(e) => setEditingMod((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Tactical Butcher Blade..."
                autoFocus
              />
            </Field>

            <Field label="Tên tiếng Việt">
              <TextInput
                value={editingMod.vietnameseName ?? ''}
                onChange={(e) => setEditingMod((prev) => ({ ...prev, vietnameseName: e.target.value }))}
                placeholder="Lưỡi dao mổ chiến thuật..."
              />
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Phẩm cấp bản vẽ">
              <Select
                value={editingMod.rarity}
                onChange={(e) => setEditingMod((prev) => ({ ...prev, rarity: e.target.value as any }))}
              >
                {Object.entries(WEAPON_MOD_RARITY_LABEL).map(([rarityKey, rarityLabel]) => (
                  <option key={rarityKey} value={rarityKey}>
                    {rarityLabel}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="ID bản độ" hint={isNewMod ? 'Mã định danh duy nhất' : 'Không sửa ID'}>
              <TextInput
                value={editingMod.id ?? ''}
                disabled={!isNewMod}
                onChange={(e) => setEditingMod((prev) => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                className="font-mono"
              />
            </Field>
          </FormRow>

          {/* Stats Section */}
          <div className="space-y-3 rounded-xl border border-line bg-subtle/40 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">Chỉ số cộng thêm / Giảm bớt</h4>
            <FormRow>
              <Field label="Sát thương (+/-)">
                <NumberInput
                  value={editingMod.stats?.damage}
                  placeholder="0"
                  onValueChange={(v) =>
                    setEditingMod((prev) => ({
                      ...prev,
                      stats: { ...prev?.stats, damage: v || undefined },
                    }))
                  }
                />
              </Field>
              <Field label="Tốc đánh (/giây, +/-)">
                <NumberInput
                  step={0.01}
                  value={editingMod.stats?.attackSpeed}
                  placeholder="0"
                  onValueChange={(v) =>
                    setEditingMod((prev) => ({
                      ...prev,
                      stats: { ...prev?.stats, attackSpeed: v || undefined },
                    }))
                  }
                />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Độ bền (+/- đòn)">
                <NumberInput
                  value={editingMod.stats?.durability}
                  placeholder="0"
                  onValueChange={(v) =>
                    setEditingMod((prev) => ({
                      ...prev,
                      stats: { ...prev?.stats, durability: v || undefined },
                    }))
                  }
                />
              </Field>
              <Field label="Chí mạng (+%)">
                <NumberInput
                  value={editingMod.stats?.critChance}
                  placeholder="0"
                  onValueChange={(v) =>
                    setEditingMod((prev) => ({
                      ...prev,
                      stats: { ...prev?.stats, critChance: v || undefined },
                    }))
                  }
                />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Độ ổn định (+/-)">
                <NumberInput
                  value={editingMod.stats?.stability}
                  placeholder="0"
                  onValueChange={(v) =>
                    setEditingMod((prev) => ({
                      ...prev,
                      stats: { ...prev?.stats, stability: v || undefined },
                    }))
                  }
                />
              </Field>
              <Field label="Độ ồn (+/- %)">
                <NumberInput
                  value={editingMod.stats?.noise}
                  placeholder="0"
                  onValueChange={(v) =>
                    setEditingMod((prev) => ({
                      ...prev,
                      stats: { ...prev?.stats, noise: v || undefined },
                    }))
                  }
                />
              </Field>
            </FormRow>
          </div>

          <Field label="Kỹ năng đặc biệt (Active skill, nếu có)">
            <TextInput
              value={editingMod.activeSkill ?? ''}
              onChange={(e) => setEditingMod((prev) => ({ ...prev, activeSkill: e.target.value }))}
              placeholder="Vd: Chém xoáy (Whirlwind Slash), Phóng lựu..."
            />
          </Field>

          <Field label="Nguồn kiếm bản vẽ">
            <TextInput
              value={editingMod.obtainDescription ?? ''}
              onChange={(e) => setEditingMod((prev) => ({ ...prev, obtainDescription: e.target.value }))}
              placeholder="Vd: Rương xanh Farm, Thẻ tím PD..."
            />
          </Field>

          <Field label="Mô tả">
            <Textarea
              rows={2}
              value={editingMod.description ?? ''}
              onChange={(e) => setEditingMod((prev) => ({ ...prev, description: e.target.value }))}
            />
          </Field>
        </FormModal>
      )}

      {/* Delete confirmation dialog */}
      {deletingModId && (
        <ConfirmDialog
          isOpen={Boolean(deletingModId)}
          title="Xác nhận xóa bản độ"
          message="Bạn có chắc chắn muốn xóa bản độ này không? Bạn có thể khôi phục lại trong Cài đặt nếu cần."
          confirmLabel="Xóa bản độ"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingModId(null)}
        />
      )}
    </div>
  );
};
