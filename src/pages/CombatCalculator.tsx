import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGameData } from '../context/DataContext';
import { calculateCombat, compareWeapons } from '../lib/calculators/combatCalculator';
import { Item, Enemy } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Calculator,
  Sword,
  Skull,
  Shield,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const CombatCalculator: React.FC = () => {
  const { db } = useGameData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected entities
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>('roamer');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('crowbar');

  // Parameters
  const [durabilityPercent, setDurabilityPercent] = useState<number>(100);
  const [isSneakAttack, setIsSneakAttack] = useState<boolean>(false);
  const [customDamage, setCustomDamage] = useState<string>('');
  const [durabilityPerHit, setDurabilityPerHit] = useState<number>(1);

  // Sync with URL query parameters (?enemy=... & ?weapon=...)
  useEffect(() => {
    const enemyParam = searchParams.get('enemy');
    const weaponParam = searchParams.get('weapon');
    if (enemyParam && db?.enemiesMap.has(enemyParam)) {
      setSelectedEnemyId(enemyParam);
    }
    if (weaponParam && db?.itemsMap.has(weaponParam)) {
      setSelectedWeaponId(weaponParam);
    }
  }, [searchParams, db]);

  const weaponsList = useMemo(() => {
    if (!db) return [];
    return db.items.filter((item) => !!item.weaponStats);
  }, [db]);

  const enemy = db?.enemiesMap.get(selectedEnemyId);
  const weapon = db?.itemsMap.get(selectedWeaponId);

  // Parse custom damage
  const parsedCustomDamage = customDamage.trim() !== '' ? Number(customDamage) : undefined;

  // Run calculation
  const calcResult = useMemo(() => {
    if (!enemy || !weapon) return null;
    return calculateCombat({
      enemy,
      weapon,
      durabilityPercent,
      isSneakAttack,
      customDamage: parsedCustomDamage,
      durabilityPerHit,
    });
  }, [enemy, weapon, durabilityPercent, isSneakAttack, parsedCustomDamage, durabilityPerHit]);

  // Weapons comparison table
  const comparisons = useMemo(() => {
    if (!enemy || weaponsList.length === 0) return [];
    return compareWeapons(enemy, weaponsList, { isSneakAttack });
  }, [enemy, weaponsList, isSneakAttack]);

  const handleReset = () => {
    setDurabilityPercent(100);
    setIsSneakAttack(false);
    setCustomDamage('');
    setDurabilityPerHit(1);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-500" />
            Máy tính chiến đấu (Combat Calculator)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Tính số đòn hạ gục, tiêu hao độ bền, đòn sneak và so sánh hiệu quả giữa các loại vũ khí.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={handleReset}
        >
          Đặt lại thông số
        </Button>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target & Weapon Selection */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <h3 className="text-sm font-mono uppercase tracking-wider text-amber-500 font-semibold mb-4 flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-400" /> 1. CHỌN MỤC TIÊU (ENEMY)
            </h3>

            {/* Enemy Select */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Xác sống / Quái vật đối đầu:
                </label>
                <select
                  value={selectedEnemyId}
                  onChange={(e) => {
                    setSelectedEnemyId(e.target.value);
                    setSearchParams({ enemy: e.target.value, weapon: selectedWeaponId });
                  }}
                  className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  {db?.enemies.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.hp} HP {e.armor > 0 ? `• Giáp ${e.armor}` : ''} • Sát thương {e.damage})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Quick Stats */}
              {enemy && (
                <div className="bg-charcoal-950 p-3 rounded-lg border border-charcoal-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Lượng máu:</span>
                    <span className="text-red-400 font-bold">{enemy.hp} HP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Sát thương đòn:</span>
                    <span className="text-amber-400 font-bold">{enemy.damage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Giáp phòng thủ:</span>
                    <span className="text-slate-200 font-bold">{enemy.armor}</span>
                  </div>
                  {enemy.abilities && enemy.abilities.length > 0 && (
                    <div className="pt-1 border-t border-charcoal-800 text-[11px] text-red-300">
                      ⚠️ Kỹ năng: {enemy.abilities.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-mono uppercase tracking-wider text-amber-500 font-semibold mb-4 flex items-center gap-2">
              <Sword className="w-4 h-4 text-amber-400" /> 2. CHỌN VŨ KHÍ TRANG BỊ
            </h3>

            {/* Weapon Select */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Vũ khí sử dụng:
                </label>
                <select
                  value={selectedWeaponId}
                  onChange={(e) => {
                    setSelectedWeaponId(e.target.value);
                    setSearchParams({ enemy: selectedEnemyId, weapon: e.target.value });
                  }}
                  className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  {weaponsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Dmg {w.weaponStats?.damage} • Bền {w.weaponStats?.durability} • {w.weaponStats?.isFirearm ? 'Súng' : 'Cận chiến'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Durability Slider & Controls */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
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
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <button onClick={() => setDurabilityPercent(25)} className="hover:text-slate-300">25%</button>
                  <button onClick={() => setDurabilityPercent(50)} className="hover:text-slate-300">50%</button>
                  <button onClick={() => setDurabilityPercent(75)} className="hover:text-slate-300">75%</button>
                  <button onClick={() => setDurabilityPercent(100)} className="hover:text-slate-300">100%</button>
                </div>
              </div>

              {/* Sneak Attack Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-lg bg-charcoal-950 border border-charcoal-800 cursor-pointer hover:border-charcoal-700 select-none">
                <input
                  type="checkbox"
                  checked={isSneakAttack}
                  onChange={(e) => setIsSneakAttack(e.target.checked)}
                  className="rounded border-charcoal-700 text-amber-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-200 block">Đòn đầu tiên là Đánh lén (Sneak Attack)</span>
                  <span className="text-slate-500">
                    Cận chiến nhân 3x sát thương, súng không tăng.
                  </span>
                </div>
              </label>

              {/* Advanced / Hypothetical Damage Override */}
              <div className="pt-2 border-t border-charcoal-800/80">
                <label className="text-xs text-slate-400 block mb-1">
                  Tùy chỉnh sát thương mỗi phát (Damage override - Tùy chọn):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={`Mặc định: ${weapon?.weaponStats?.damage || 0}`}
                    value={customDamage}
                    onChange={(e) => setCustomDamage(e.target.value)}
                    className="flex-1 bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                  {customDamage && (
                    <Button size="sm" variant="ghost" onClick={() => setCustomDamage('')}>
                      Xóa
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Hữu ích khi gắn mod tăng damage hoặc tính toán giả định vũ khí chưa xác minh.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Calculation Results & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          {calcResult && calcResult.isValid ? (
            <Card highlight="amber" className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-semibold block">
                    KẾT QUẢ TÍNH TOÁN CHIẾN ĐẤU
                  </span>
                  <h3 className="text-base font-bold text-slate-100">
                    {calcResult.weaponName} vs {calcResult.enemyName}
                  </h3>
                </div>
                <Badge variant="amber" size="md">
                  DPS: {calcResult.dps}
                </Badge>
              </div>

              {/* Big Stat Callouts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-charcoal-950 p-3 rounded-lg border border-charcoal-800">
                  <span className="text-xs text-slate-500 block mb-1">SỐ ĐÒN TIÊU DIỆT</span>
                  <span className="text-2xl font-bold text-amber-400">
                    {calcResult.hitsToKill}{' '}
                    <span className="text-xs font-normal text-slate-400">đòn</span>
                  </span>
                </div>

                <div className="bg-charcoal-950 p-3 rounded-lg border border-charcoal-800">
                  <span className="text-xs text-slate-500 block mb-1">HẠ ĐƯỢC TỐI ĐA</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {calcResult.enemiesKillable}{' '}
                    <span className="text-xs font-normal text-slate-400">con</span>
                  </span>
                </div>

                <div className="bg-charcoal-950 p-3 rounded-lg border border-charcoal-800">
                  <span className="text-xs text-slate-500 block mb-1">ĐỘ BỀN TIÊU HAO</span>
                  <span className="text-2xl font-bold text-slate-200">
                    {calcResult.durabilityConsumedPerKill}
                    <span className="text-xs font-normal text-slate-400">
                      /{calcResult.effectiveDurability}
                    </span>
                  </span>
                </div>

                <div className="bg-charcoal-950 p-3 rounded-lg border border-charcoal-800">
                  <span className="text-xs text-slate-500 block mb-1">THỜI GIAN HẠ (TTK)</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {calcResult.timeToKillSeconds}s
                  </span>
                </div>
              </div>

              {/* Breakdown details */}
              <div className="bg-charcoal-950/70 p-3.5 rounded-lg border border-charcoal-800 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Sát thương đòn đánh đầu:</span>
                  <span className="text-slate-200 font-bold">{calcResult.firstHitDamage} dmg</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Sát thương các đòn kế tiếp:</span>
                  <span className="text-slate-200 font-bold">{calcResult.effectiveDamagePerHit} dmg</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Độ bền còn lại khả dụng:</span>
                  <span className="text-slate-200 font-bold">
                    {calcResult.effectiveDurability} lượt đánh
                  </span>
                </div>
              </div>

              {/* Assumptions Banner */}
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> GIẢ ĐỊNH TÍNH TOÁN:
                </span>
                {calcResult.assumptions.map((assump, idx) => (
                  <p key={idx} className="text-slate-300 font-mono text-[11px]">
                    • {assump}
                  </p>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-8 text-slate-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              Thiếu dữ liệu vũ khí hoặc quái vật để thực hiện phép tính.
            </Card>
          )}

          {/* Multi-Weapon Comparison Matrix */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2">
                  BẢNG SO SÁNH CÁC LOẠI VŨ KHÍ
                </h3>
                <p className="text-xs text-slate-400">
                  Hiệu quả khi đối đầu với mục tiêu <b className="text-red-400">{enemy?.name}</b>
                </p>
              </div>
              <Badge variant="charcoal">{comparisons.length} vũ khí</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-charcoal-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Vũ khí</th>
                    <th className="py-2.5 px-3">Sát thương</th>
                    <th className="py-2.5 px-3">Số đòn hạ</th>
                    <th className="py-2.5 px-3">Hạ được</th>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-800/60">
                  {comparisons.map((c) => {
                    const isCurrent = c.weaponId === selectedWeaponId;
                    return (
                      <tr
                        key={c.weaponId}
                        className={`hover:bg-charcoal-800/50 transition-colors ${
                          isCurrent ? 'bg-amber-950/20 text-amber-300' : 'text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold flex items-center gap-1.5">
                          {c.weaponName}
                          {isCurrent && (
                            <span className="text-[10px] text-amber-500 font-normal">(Đang chọn)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">{c.damage}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-400">{c.hitsToKill}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">
                          {c.enemiesKillable} con
                        </td>
                        <td className="py-2.5 px-3">{c.timeToKillSeconds}s</td>
                        <td className="py-2.5 px-3 text-right">
                          {!isCurrent && (
                            <button
                              onClick={() => setSelectedWeaponId(c.weaponId)}
                              className="text-amber-500 hover:text-amber-400 underline cursor-pointer"
                            >
                              Chọn
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
