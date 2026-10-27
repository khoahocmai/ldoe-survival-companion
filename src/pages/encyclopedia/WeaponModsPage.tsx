import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Plus, RotateCcw, Sparkles, Wrench } from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { WeaponMod, WeaponModSlot } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import { EmptyState, PageHeader } from '../../components/common/Layout';
import { storageService } from '../../services/storageService';
import { WEAPON_MOD_SLOT_LABEL, WEAPON_MOD_RARITY_TONE } from '../../lib/labels';
import { aggregateModMaterials, calculateModdedStats } from '../../lib/calculators/weaponModCalculator';
import { ModFormModal } from '../../components/weaponmods/ModFormModal';
import { ModOption } from '../../components/weaponmods/ModOption';
import { ModSummary } from '../../components/weaponmods/ModSummary';
import { WeaponRail, WeaponStrip } from '../../components/weaponmods/WeaponPicker';

const RAIL_KEY = 'ldoe_weapon_rail_collapsed';
const SLOT_ORDER: WeaponModSlot[] = ['blade', 'tip', 'handle', 'muzzle', 'magazine', 'sight', 'grip', 'stock'];
const RARITY_SCORE = { common: 1, rare: 2, extremely_rare: 3 } as const;

export const WeaponModsPage: React.FC = () => {
  const { db, reload } = useGameData();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showRail = useMediaQuery('(min-width: 1280px)');

  const [selectedWeaponId, setSelectedWeaponId] = useState('');
  const [equipped, setEquipped] = useState<Record<string, string | null>>({});
  const [railCollapsed, setRailCollapsed] = useState(() => {
    try {
      return localStorage.getItem(RAIL_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [editingMod, setEditingMod] = useState<Partial<WeaponMod> | null>(null);
  const [isNewMod, setIsNewMod] = useState(false);
  const [deletingModId, setDeletingModId] = useState<string | null>(null);

  // Weapons that already have mods come first.
  const weapons = useMemo(() => {
    if (!db) return [];
    const count = (id: string) => db.weaponModsByWeaponIdMap.get(id)?.length ?? 0;
    return db.items
      .filter((item) => !!item.weaponStats)
      .sort((a, b) => Number(count(b.id) > 0) - Number(count(a.id) > 0) || a.name.localeCompare(b.name));
  }, [db]);

  const modCounts = useMemo(
    () => new Map(weapons.map((w) => [w.id, db?.weaponModsByWeaponIdMap.get(w.id)?.length ?? 0])),
    [weapons, db]
  );

  const sortedItems = useMemo(() => [...(db?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [db?.items]);

  // ?weapon=... picks the weapon (links from Items / Combat); otherwise the first one.
  const weaponParam = searchParams.get('weapon');
  useEffect(() => {
    if (weapons.length === 0) return;
    setSelectedWeaponId((current) =>
      weaponParam && weapons.some((w) => w.id === weaponParam)
        ? weaponParam
        : weapons.some((w) => w.id === current)
          ? current
          : weapons[0].id
    );
  }, [weapons, weaponParam]);

  const weapon = db?.itemsMap.get(selectedWeaponId);
  const mods = useMemo(() => (weapon ? db?.weaponModsByWeaponIdMap.get(weapon.id) ?? [] : []), [db, weapon]);

  const slots = useMemo(() => {
    const present = new Set(mods.map((m) => m.slot));
    return SLOT_ORDER.filter((s) => present.has(s));
  }, [mods]);

  const equippedMods = useMemo(
    () => Object.values(equipped).flatMap((id) => (id ? [db?.weaponModsMap.get(id)].filter((m): m is WeaponMod => Boolean(m)) : [])),
    [equipped, db]
  );

  const stats = useMemo(() => (weapon ? calculateModdedStats(weapon, equippedMods) : null), [weapon, equippedMods]);
  const materials = useMemo(() => aggregateModMaterials(equippedMods, db?.itemsMap), [equippedMods, db]);

  const selectWeapon = (id: string) => {
    setSelectedWeaponId(id);
    setEquipped({});
    setSearchParams({ weapon: id }, { replace: true });
  };

  const toggleMod = (slot: WeaponModSlot, id: string) =>
    setEquipped((prev) => ({ ...prev, [slot]: prev[slot] === id ? null : id }));

  // Best build: per slot the rarest mod, ties broken by damage.
  const applySuggested = () => {
    const next: Record<string, string | null> = {};
    for (const slot of slots) {
      const best = [...mods.filter((m) => m.slot === slot)].sort(
        (a, b) => RARITY_SCORE[b.rarity] - RARITY_SCORE[a.rarity] || (b.stats.damage ?? 0) - (a.stats.damage ?? 0)
      )[0];
      if (best) next[slot] = best.id;
    }
    setEquipped(next);
  };

  const toggleRail = () =>
    setRailCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(RAIL_KEY, next ? '1' : '0');
      } catch {
        /* preference just won't persist */
      }
      return next;
    });

  const openNewMod = (slot?: WeaponModSlot) => {
    if (!weapon) return;
    setIsNewMod(true);
    setEditingMod({
      id: `mod_${weapon.id}_custom_${Date.now()}`,
      weaponId: weapon.id,
      slot: slot ?? slots[0] ?? (weapon.category === 'weapon_melee' ? 'blade' : 'muzzle'),
      name: '',
      vietnameseName: '',
      rarity: 'common',
      stats: {},
      materials: [],
    });
  };

  const openEditMod = (mod: WeaponMod) => {
    setIsNewMod(false);
    setEditingMod({ ...mod, stats: { ...mod.stats }, materials: mod.materials.map((m) => ({ ...m })) });
  };

  const saveMod = async () => {
    if (!editingMod?.name?.trim() || !editingMod.id?.trim() || !editingMod.weaponId) return;
    const entity: WeaponMod = {
      ...editingMod,
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
    toast.success('Đã lưu bản độ.');
  };

  const deleteMod = async () => {
    if (!deletingModId) return;
    storageService.deleteOrHideEntity('customWeaponMods', deletingModId);
    setEquipped((prev) => Object.fromEntries(Object.entries(prev).map(([slot, id]) => [slot, id === deletingModId ? null : id])));
    await reload();
    toast.success('Đã xóa bản độ.');
  };

  if (!db) return null;

  if (!weapon || !stats) {
    return (
      <div>
        <PageHeader title="Bản độ vũ khí" icon={<Wrench />} />
        <EmptyState icon={<Wrench />} title="Chưa có vũ khí nào" description="Thêm vũ khí có chỉ số vào Vật phẩm để bắt đầu độ." />
      </div>
    );
  }

  const pickerProps = { weapons, modCounts, selectedId: weapon.id, onSelect: selectWeapon };

  return (
    <div>
      <PageHeader
        title="Bản độ vũ khí"
        description="Chọn linh kiện cho từng vị trí, xem chỉ số sau khi độ và tổng nguyên liệu cần có."
        icon={<Wrench />}
        actions={
          <Button icon={<Plus />} onClick={() => openNewMod()}>
            <span className="hidden sm:inline">Thêm bản độ</span>
            <span className="sm:hidden">Thêm</span>
          </Button>
        }
      />

      {!showRail && <WeaponStrip {...pickerProps} />}

      <div className="flex items-start gap-4">
        {showRail && <WeaponRail {...pickerProps} collapsed={railCollapsed} onToggle={toggleRail} />}

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="font-semibold text-fg">{weapon.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-faint" />
                <Link to={`/wiki/items?select=${weapon.id}`} className="text-accent hover:underline">
                  Xem vật phẩm
                </Link>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" icon={<Sparkles />} onClick={applySuggested} disabled={slots.length === 0}>
                  Gợi ý bản mạnh nhất
                </Button>
                <Button size="sm" variant="ghost" icon={<RotateCcw />} onClick={() => setEquipped({})} disabled={equippedMods.length === 0}>
                  Tháo hết
                </Button>
              </div>
            </div>

            {slots.length === 0 ? (
              <EmptyState
                icon={<Wrench />}
                title={`${weapon.name} chưa có bản độ`}
                description="Thêm bản độ đầu tiên để bắt đầu lắp ráp."
                action={
                  <Button icon={<Plus />} onClick={() => openNewMod()}>
                    Thêm bản độ
                  </Button>
                }
              />
            ) : (
              slots.map((slot) => {
                const slotMods = mods.filter((m) => m.slot === slot);
                const active = slotMods.find((m) => m.id === equipped[slot]);
                return (
                  <Card key={slot} padded={false}>
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold">{WEAPON_MOD_SLOT_LABEL[slot] ?? slot}</h2>
                        <p className="text-xs text-muted">{slotMods.length} lựa chọn · chọn một</p>
                      </div>
                      {active ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <Badge tone={WEAPON_MOD_RARITY_TONE[active.rarity]}>{active.name}</Badge>
                          <button type="button" onClick={() => toggleMod(slot, active.id)} className="shrink-0 text-xs text-muted hover:text-danger">
                            Tháo
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-faint">Chưa lắp</span>
                      )}
                    </div>
                    <ul role="radiogroup" aria-label={WEAPON_MOD_SLOT_LABEL[slot]} className="space-y-2 border-t border-line p-3">
                      {slotMods.map((mod) => (
                        <ModOption
                          key={mod.id}
                          mod={mod}
                          selected={equipped[slot] === mod.id}
                          itemsMap={db.itemsMap}
                          onToggle={() => toggleMod(slot, mod.id)}
                          onEdit={() => openEditMod(mod)}
                          onDelete={() => setDeletingModId(mod.id)}
                        />
                      ))}
                      <li>
                        <button
                          type="button"
                          onClick={() => openNewMod(slot)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs text-muted transition-colors hover:border-accent-solid hover:text-accent"
                        >
                          <Plus className="h-3.5 w-3.5" /> Thêm lựa chọn cho {WEAPON_MOD_SLOT_LABEL[slot]?.toLowerCase()}
                        </button>
                      </li>
                    </ul>
                  </Card>
                );
              })
            )}
          </div>

          <div className="lg:sticky lg:top-0 lg:self-start">
            <ModSummary
              weapon={weapon}
              stats={stats}
              materials={materials}
              equippedCount={equippedMods.length}
              slotCount={slots.length}
              itemsMap={db.itemsMap}
              onOpenCombat={() => navigate(`/combat?weapon=${weapon.id}&customDamage=${stats.damage}`)}
              onOpenPlanner={() =>
                navigate(
                  `/planner?materials=${encodeURIComponent(materials.map((m) => `${m.itemId}:${m.quantity}`).join(','))}&title=${encodeURIComponent(`Bản độ ${weapon.name}`)}`
                )
              }
            />
          </div>
        </div>
      </div>

      <ModFormModal
        mod={editingMod}
        isNew={isNewMod}
        weapons={weapons}
        items={sortedItems}
        onChange={(changes) => setEditingMod((prev) => (prev ? { ...prev, ...changes } : prev))}
        onSave={saveMod}
        onClose={() => setEditingMod(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingModId)}
        title="Xóa bản độ này?"
        message="Bản độ sẽ bị ẩn khỏi danh sách."
        confirmLabel="Xóa"
        onConfirm={deleteMod}
        onCancel={() => setDeletingModId(null)}
      />
    </div>
  );
};
