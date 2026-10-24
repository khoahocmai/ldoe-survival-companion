import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calculator, RotateCcw, Target } from 'lucide-react';
import { useGameData } from '../context/DataContext';
import { calculateCombat, compareWeapons } from '../lib/calculators/combatCalculator';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Checkbox, Field, NumberInput, Select } from '../components/common/Field';
import { Callout, EmptyState, PageHeader, Section, Stat, StatGrid } from '../components/common/Layout';

export const CombatCalculator: React.FC = () => {
  const { db } = useGameData();
  const [searchParams, setSearchParams] = useSearchParams();

  const weaponsList = useMemo(() => (db?.items ?? []).filter((item) => !!item.weaponStats), [db]);
  const enemies = db?.enemies ?? [];

  const [enemyId, setEnemyId] = useState('');
  const [weaponId, setWeaponId] = useState('');
  const [durabilityPercent, setDurabilityPercent] = useState(100);
  const [isSneakAttack, setIsSneakAttack] = useState(false);
  const [customDamage, setCustomDamage] = useState<number | undefined>(undefined);
  const [targetKillCount, setTargetKillCount] = useState(1);

  // Links from other pages (?enemy=&weapon=&count=) win; otherwise fall back to the first entries.
  useEffect(() => {
    if (!db) return;
    const enemyParam = searchParams.get('enemy');
    const weaponParam = searchParams.get('weapon');
    const countParam = Number(searchParams.get('count'));

    setEnemyId((current) =>
      enemyParam && db.enemiesMap.has(enemyParam) ? enemyParam : db.enemiesMap.has(current) ? current : enemies[0]?.id ?? ''
    );
    setWeaponId((current) =>
      weaponParam && db.itemsMap.get(weaponParam)?.weaponStats
        ? weaponParam
        : db.itemsMap.get(current)?.weaponStats
          ? current
          : weaponsList[0]?.id ?? ''
    );
    if (Number.isFinite(countParam) && countParam >= 1) setTargetKillCount(Math.floor(countParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, db]);

  const remember = (key: 'enemy' | 'weapon', value: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      },
      { replace: true }
    );

  const enemy = db?.enemiesMap.get(enemyId);
  const weapon = db?.itemsMap.get(weaponId);

  const result = useMemo(() => {
    if (!enemy || !weapon) return null;
    return calculateCombat({
      enemy,
      weapon,
      durabilityPercent,
      isSneakAttack,
      customDamage: customDamage && customDamage > 0 ? customDamage : undefined,
    });
  }, [enemy, weapon, durabilityPercent, isSneakAttack, customDamage]);

  const comparisons = useMemo(
    () => (enemy ? compareWeapons(enemy, weaponsList, { isSneakAttack }) : []),
    [enemy, weaponsList, isSneakAttack]
  );

  const weaponsNeeded = result && result.enemiesKillable > 0 ? Math.ceil(targetKillCount / result.enemiesKillable) : null;

  const reset = () => {
    setDurabilityPercent(100);
    setIsSneakAttack(false);
    setCustomDamage(undefined);
    setTargetKillCount(1);
  };

  return (
    <div>
      <PageHeader
        title="Máy tính chiến đấu"
        description="Số đòn để hạ quái, độ bền tiêu hao và so sánh các vũ khí."
        icon={<Calculator />}
        actions={
          <>
            <Link to="/points">
              <Button variant="secondary" size="sm" icon={<Target />}>
                Điểm sự kiện
              </Button>
            </Link>
            <Button variant="ghost" size="sm" icon={<RotateCcw />} onClick={reset}>
              Đặt lại
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <Card className="space-y-4">
            <Section title="Mục tiêu">
              <Field label="Quái vật">
                <Select value={enemyId} onChange={(e) => (setEnemyId(e.target.value), remember('enemy', e.target.value))}>
                  {enemies.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} · {e.hp} HP
                    </option>
                  ))}
                </Select>
              </Field>
              {enemy && (
                <StatGrid cols={3} className="mt-3">
                  <Stat label="Máu" value={enemy.hp} tone="danger" />
                  <Stat label="Sát thương" value={enemy.damage} />
                  <Stat label="Giáp" value={enemy.armor} />
                </StatGrid>
              )}
              {enemy?.abilities && enemy.abilities.length > 0 && (
                <p className="mt-2 text-xs text-danger">Kỹ năng: {enemy.abilities.join(', ')}</p>
              )}
            </Section>
          </Card>

          <Card className="space-y-4">
            <Section title="Vũ khí">
              <Field label="Vũ khí sử dụng">
                <Select value={weaponId} onChange={(e) => (setWeaponId(e.target.value), remember('weapon', e.target.value))}>
                  {weaponsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} · {w.weaponStats?.damage} dmg
                    </option>
                  ))}
                </Select>
              </Field>
            </Section>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <label htmlFor="durability" className="font-medium text-muted">
                  Độ bền còn lại
                </label>
                <span className="num font-semibold text-accent">{durabilityPercent}%</span>
              </div>
              <input
                id="durability"
                type="range"
                min={1}
                max={100}
                value={durabilityPercent}
                onChange={(e) => setDurabilityPercent(Number(e.target.value))}
                className="w-full accent-[rgb(var(--accent-solid))]"
              />
              <div className="mt-1 flex gap-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDurabilityPercent(pct)}
                    className={`num flex-1 rounded-md py-1 text-xs ${
                      durabilityPercent === pct ? 'bg-accent-soft font-medium text-accent' : 'bg-subtle text-muted hover:text-fg'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <Checkbox
              checked={isSneakAttack}
              onChange={setIsSneakAttack}
              label="Đòn đầu là đánh lén"
              hint="Cận chiến nhân 3× sát thương đòn đầu; súng không tăng."
            />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Số quái cần hạ">
                <NumberInput min={1} value={targetKillCount} onValueChange={(v) => setTargetKillCount(Math.max(1, Math.floor(v)))} />
              </Field>
              <Field label="Ghi đè sát thương" hint={`Mặc định ${weapon?.weaponStats?.damage ?? 0}`}>
                <NumberInput value={customDamage} onValueChange={(v) => setCustomDamage(v || undefined)} placeholder="Mod / buff" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-7">
          {result?.isValid ? (
            <Card className="space-y-4" selected>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Kết quả</p>
                  <h2 className="text-lg font-semibold">
                    {result.weaponName} <span className="font-normal text-muted">vs</span> {result.enemyName}
                  </h2>
                </div>
                <Badge tone="accent" size="md">
                  DPS {result.dps}
                </Badge>
              </div>

              <StatGrid cols={4}>
                <Stat label="Số đòn hạ" value={result.hitsToKill} unit="đòn" tone="accent" />
                <Stat label="Hạ được mỗi cây" value={result.enemiesKillable} unit="con" tone="ok" />
                <Stat label="Độ bền tiêu hao" value={result.durabilityConsumedPerKill} unit={`/ ${result.effectiveDurability}`} />
                <Stat label="Thời gian hạ" value={`${result.timeToKillSeconds}s`} tone="info" />
              </StatGrid>

              {targetKillCount > 1 &&
                (weaponsNeeded ? (
                  <Callout tone="accent">
                    Để hạ <strong>{targetKillCount}</strong> {enemy?.name}, mang khoảng <strong>{weaponsNeeded}</strong> cây{' '}
                    {result.weaponName}.
                  </Callout>
                ) : (
                  <Callout tone="danger">Vũ khí này không hạ nổi con nào với độ bền hiện tại.</Callout>
                ))}

              <dl className="divide-y divide-line rounded-lg border border-line text-sm">
                <div className="flex justify-between px-3 py-2">
                  <dt className="text-muted">Sát thương đòn đầu</dt>
                  <dd className="num font-medium">{result.firstHitDamage}</dd>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <dt className="text-muted">Sát thương các đòn sau</dt>
                  <dd className="num font-medium">{result.effectiveDamagePerHit}</dd>
                </div>
              </dl>

              <details className="text-sm text-muted">
                <summary className="cursor-pointer select-none font-medium hover:text-fg">Giả định tính toán</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {result.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </details>
            </Card>
          ) : (
            <EmptyState icon={<Calculator />} title="Chưa đủ dữ liệu" description="Chọn quái vật và vũ khí để bắt đầu tính." />
          )}

          <Card padded={false}>
            <div className="flex items-center justify-between gap-3 px-4 pt-4">
              <div>
                <h3 className="text-sm font-semibold">So sánh vũ khí</h3>
                <p className="text-xs text-muted">Hiệu quả khi đánh {enemy?.name}</p>
              </div>
              <Badge>{comparisons.length} vũ khí</Badge>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-y border-line text-xs text-muted">
                    <th className="px-4 py-2 font-medium">Vũ khí</th>
                    <th className="px-2 py-2 text-right font-medium">Dmg</th>
                    <th className="px-2 py-2 text-right font-medium">Số đòn</th>
                    <th className="px-2 py-2 text-right font-medium">Hạ được</th>
                    <th className="px-2 py-2 text-right font-medium">Thời gian</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {comparisons.map((c) => {
                    const current = c.weaponId === weaponId;
                    return (
                      <tr key={c.weaponId} className={current ? 'bg-accent-soft/50' : 'hover:bg-subtle'}>
                        <td className="px-4 py-2 font-medium">
                          {c.weaponName}
                          {c.isFirearm && <span className="ml-1.5 text-xs font-normal text-faint">súng</span>}
                        </td>
                        <td className="num px-2 py-2 text-right">{c.damage}</td>
                        <td className="num px-2 py-2 text-right font-semibold text-accent">{c.hitsToKill}</td>
                        <td className="num px-2 py-2 text-right font-semibold text-ok">{c.enemiesKillable}</td>
                        <td className="num px-2 py-2 text-right">{c.timeToKillSeconds}s</td>
                        <td className="px-4 py-2 text-right">
                          {current ? (
                            <span className="text-xs text-muted">Đang chọn</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => (setWeaponId(c.weaponId), remember('weapon', c.weaponId))}
                              className="text-xs font-medium text-accent hover:underline"
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
