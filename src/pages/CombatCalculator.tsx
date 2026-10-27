import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calculator, RotateCcw, Target, Wrench } from 'lucide-react';
import { useGameData } from '../context/DataContext';
import { calculateCombat, compareWeapons } from '../lib/calculators/combatCalculator';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Checkbox, Field, NumberInput, Select, Slider } from '../components/common/Field';
import { Table, Tbody, Td, Th, Thead, Tr } from '../components/common/Table';
import { Callout, EmptyState, FilterChips, PageHeader, Section, Stat, StatGrid } from '../components/common/Layout';

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
    const customDamageParam = Number(searchParams.get('customDamage'));

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
    if (Number.isFinite(customDamageParam) && customDamageParam > 0) setCustomDamage(customDamageParam);
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
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
              {(db?.weaponModsByWeaponIdMap.get(weaponId)?.length ?? 0) > 0 && (
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted">Có sẵn bản độ</span>
                  <Link
                    to={`/wiki/weapon-mods?weapon=${weaponId}`}
                    className="flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                  >
                    <Wrench className="h-3 w-3" /> Bàn độ vũ khí ({db?.weaponModsByWeaponIdMap.get(weaponId)?.length} mod)
                  </Link>
                </div>
              )}
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
              <Slider id="durability" label="Độ bền còn lại" min={1} max={100} value={durabilityPercent} onChange={setDurabilityPercent} />
              <FilterChips
                className="mt-1"
                options={[25, 50, 75, 100].map((pct) => ({ id: String(pct), label: `${pct}%` }))}
                value={String(durabilityPercent)}
                onChange={(id) => setDurabilityPercent(Number(id))}
              />
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

        <div className="space-y-4 lg:col-span-7">
          {result?.isValid ? (
            <Card className="space-y-4" selected>
              {/* role="status": screen readers hear the new outcome whenever an input changes it. */}
              <div className="flex items-start justify-between gap-3" role="status">
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
            <div className="mt-3 border-t border-line">
              <Table caption="So sánh vũ khí">
                <Thead>
                  <Th>Vũ khí</Th>
                  <Th align="right">Dmg</Th>
                  <Th align="right">Số đòn</Th>
                  <Th align="right">Hạ được</Th>
                  <Th align="right">Thời gian</Th>
                  <Th>
                    <span className="sr-only">Thao tác</span>
                  </Th>
                </Thead>
                <Tbody>
                  {comparisons.map((c) => {
                    const current = c.weaponId === weaponId;
                    return (
                      <Tr key={c.weaponId} highlight={current}>
                        <Td className="font-medium">
                          {c.weaponName}
                          {c.isFirearm && <span className="ml-1.5 text-xs font-normal text-muted">súng</span>}
                        </Td>
                        <Td numeric align="right">
                          {c.damage}
                        </Td>
                        <Td numeric align="right" className="font-semibold text-accent">
                          {c.hitsToKill}
                        </Td>
                        <Td numeric align="right" className="font-semibold text-ok">
                          {c.enemiesKillable}
                        </Td>
                        <Td numeric align="right">
                          {c.timeToKillSeconds}s
                        </Td>
                        <Td align="right">
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
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
