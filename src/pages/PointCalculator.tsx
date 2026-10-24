import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Plus, Skull, Target, Trash2, Trophy } from 'lucide-react';
import { useGameData } from '../context/DataContext';
import {
  calculateMixedEnemyPoints,
  calculateSingleEnemyPointKills,
  MixedEnemyKillInput,
} from '../lib/calculators/pointCalculator';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { IconButton } from '../components/common/Button';
import { Field, NumberInput, Select } from '../components/common/Field';
import { Callout, EmptyState, PageHeader, ProgressBar, Stat, StatGrid } from '../components/common/Layout';
import { Tabs } from '../components/common/Tabs';

const DEFAULT_PLAN: MixedEnemyKillInput[] = [
  { enemyId: 'roamer', killCount: 50 },
  { enemyId: 'fast_biter', killCount: 30 },
  { enemyId: 'floater_bloater', killCount: 15 },
  { enemyId: 'toxic_abomination', killCount: 10 },
  { enemyId: 'frenzied_giant', killCount: 5 },
];

export const PointCalculator: React.FC = () => {
  const { db } = useGameData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const systems = db?.pointSystems ?? [];
  const [systemId, setSystemId] = useState('');
  const [targetPoints, setTargetPoints] = useState(0);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [locationId, setLocationId] = useState('');
  const [mode, setMode] = useState<'single' | 'mixed'>('single');
  const [plan, setPlan] = useState<MixedEnemyKillInput[] | null>(null);

  const system = systems.find((s) => s.id === systemId);

  const selectSystem = (id: string) => {
    setSystemId(id);
    const next = systems.find((s) => s.id === id);
    setTargetPoints(next?.milestones[next.milestones.length - 1]?.points ?? 0);
  };

  // First load, and ?system=... links from global search.
  const systemParam = searchParams.get('system');
  useEffect(() => {
    if (systems.length === 0) return;
    const wanted = systemParam && systems.some((s) => s.id === systemParam) ? systemParam : systems.some((s) => s.id === systemId) ? systemId : systems[0].id;
    if (wanted !== systemId) selectSystem(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systems, systemParam]);

  // Kill plan starts from the defaults that exist in the current database.
  useEffect(() => {
    if (db && plan === null) setPlan(DEFAULT_PLAN.filter((k) => db.enemiesMap.has(k.enemyId)));
  }, [db, plan]);
  const plannedKills = plan ?? [];

  const hasRules = Boolean(db?.enemyPointRules.some((r) => r.pointSystemId === systemId));

  const singleResult = useMemo(() => {
    if (!system || !db || !hasRules) return null;
    return calculateSingleEnemyPointKills({
      pointSystem: system,
      targetPoints,
      currentPoints,
      rules: db.enemyPointRules,
      enemies: db.enemies,
      locationId: locationId || undefined,
    });
  }, [system, db, hasRules, targetPoints, currentPoints, locationId]);

  const mixedResult = useMemo(() => {
    if (!system || !db || !hasRules) return null;
    return calculateMixedEnemyPoints({
      pointSystem: system,
      targetPoints,
      currentPoints,
      plannedKills,
      rules: db.enemyPointRules,
      enemiesMap: db.enemiesMap,
      locationId: locationId || undefined,
    });
  }, [system, db, hasRules, targetPoints, currentPoints, plannedKills, locationId]);

  const setKillCount = (enemyId: string, count: number) =>
    setPlan(plannedKills.map((k) => (k.enemyId === enemyId ? { ...k, killCount: Math.max(0, Math.floor(count)) } : k)));

  const excludedAtLocation =
    Boolean(locationId) &&
    Boolean(singleResult) &&
    singleResult!.results.length > 0 &&
    singleResult!.results.every((r) => r.pointsPerKill === 0);

  if (!db) return null;

  return (
    <div>
      <PageHeader
        title="Điểm sự kiện"
        description="Cần hạ bao nhiêu quái để chạm mốc phần thưởng của sự kiện Tiếp tế và các sự kiện tương tự."
        icon={<Target />}
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Sự kiện">
            <Select value={systemId} onChange={(e) => selectSystem(e.target.value)}>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={`Mốc mục tiêu (${system?.unit ?? 'điểm'})`}>
            <NumberInput value={targetPoints} onValueChange={(v) => setTargetPoints(Math.floor(v))} />
          </Field>
          <Field label="Đã tích lũy">
            <NumberInput value={currentPoints} onValueChange={(v) => setCurrentPoints(Math.floor(v))} />
          </Field>
          <Field label="Khu vực">
            <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">Chung (mọi nơi)</option>
              {db.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {system && system.milestones.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {system.milestones.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={targetPoints === m.points}
                onClick={() => setTargetPoints(m.points)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  targetPoints === m.points ? 'bg-fg text-bg' : 'border border-line bg-surface text-muted hover:text-fg'
                }`}
              >
                {m.name} <span className="num opacity-70">· {m.points}</span>
              </button>
            ))}
          </div>
        )}
        {system?.description && <p className="mt-3 text-sm text-muted">{system.description}</p>}
      </Card>

      {excludedAtLocation && (
        <div className="mb-6">
          <Callout tone="warn" icon={<AlertTriangle />}>
            Tại khu vực này quái <strong>không cộng điểm</strong> cho sự kiện đang chọn.
          </Callout>
        </div>
      )}

      {!hasRules ? (
        <EmptyState
          icon={<Target />}
          title="Sự kiện này tính theo mốc, không theo số quái"
          description="Chưa có bảng điểm cho từng loại quái, nên chưa thể quy đổi ra số lượng cần hạ. Các mốc ở trên chỉ để tham khảo."
        />
      ) : (
        <div className="space-y-5">
          <Tabs
            tabs={[
              { id: 'single', label: 'Từng loại quái', icon: <Skull /> },
              { id: 'mixed', label: 'Kế hoạch kết hợp', icon: <Trophy /> },
            ]}
            activeTab={mode}
            onChange={(id) => setMode(id as 'single' | 'mixed')}
          />

          {mode === 'single' && singleResult && (
            <>
              <p className="text-sm text-muted">
                Còn thiếu <strong className="num text-fg">{singleResult.remainingPoints}</strong> /{' '}
                <span className="num">{singleResult.targetPoints}</span> điểm. Bấm vào quái để tính vũ khí.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {singleResult.results.map((r) => {
                  const usable = r.isEligible && r.killsNeeded !== null;
                  return (
                    <Card
                      key={r.enemyId}
                      disabled={!usable}
                      onClick={usable && r.killsNeeded ? () => navigate(`/combat?enemy=${r.enemyId}&count=${r.killsNeeded}`) : undefined}
                      className="flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold">{r.enemyName}</h3>
                          {r.pointsPerKill !== null && r.pointsPerKill > 0 && <Badge tone="accent">+{r.pointsPerKill} điểm</Badge>}
                        </div>
                        {r.notes && <p className="mt-1 text-xs text-muted">{r.notes}</p>}
                      </div>
                      {usable ? (
                        <div className="flex items-end justify-between border-t border-line pt-3">
                          <div>
                            <div className="text-xs text-muted">Cần hạ</div>
                            <div className="num text-xl font-semibold text-accent">
                              {r.killsNeeded} <span className="text-xs font-normal text-muted">con</span>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-xs font-medium text-accent">
                            Tính vũ khí <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      ) : (
                        <p className="border-t border-line pt-3 text-xs text-faint">Không cộng điểm ở đây</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {mode === 'mixed' && mixedResult && (
            <>
              <Card className="space-y-3" selected={mixedResult.isTargetReached}>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow">Dự kiến tích lũy</p>
                    <p className="num text-2xl font-semibold">
                      {mixedResult.totalProjectedPoints} <span className="text-base font-normal text-muted">/ {mixedResult.targetPoints}</span>
                    </p>
                  </div>
                  <Badge tone={mixedResult.isTargetReached ? 'ok' : 'accent'} size="md">
                    {mixedResult.isTargetReached ? 'Đủ điều kiện' : `Thiếu ${mixedResult.remainingPoints}`}
                  </Badge>
                </div>
                <ProgressBar percent={mixedResult.progressPercent} tone={mixedResult.isTargetReached ? 'ok' : 'accent'} />
                <StatGrid cols={3}>
                  <Stat label="Đã có" value={mixedResult.currentPoints} />
                  <Stat label="Từ kế hoạch" value={`+${mixedResult.pointsFromPlannedKills}`} tone="accent" />
                  <Stat label="Tiến độ" value={`${mixedResult.progressPercent}%`} />
                </StatGrid>
              </Card>

              <Card padded={false}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-xs text-muted">
                        <th className="px-4 py-2 font-medium">Quái</th>
                        <th className="px-2 py-2 text-right font-medium">Điểm / con</th>
                        <th className="px-2 py-2 text-center font-medium">Số lượng</th>
                        <th className="px-2 py-2 text-right font-medium">Tổng</th>
                        <th className="w-12 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {mixedResult.items.map((row) => (
                        <tr key={row.enemyId}>
                          <td className="px-4 py-2.5 font-medium">
                            {row.enemyName}
                            {!row.isEligible && <span className="ml-2 text-xs font-normal text-faint">không cộng điểm</span>}
                          </td>
                          <td className="num px-2 py-2.5 text-right text-muted">+{row.pointsPerKill}</td>
                          <td className="px-2 py-2.5">
                            <NumberInput
                              aria-label={`Số ${row.enemyName}`}
                              value={row.killCount}
                              onValueChange={(v) => setKillCount(row.enemyId, v)}
                              className="mx-auto h-8 w-20 text-center"
                            />
                          </td>
                          <td className="num px-2 py-2.5 text-right font-semibold text-accent">+{row.totalPoints}</td>
                          <td className="px-2 py-2.5 text-right">
                            <IconButton label="Bỏ khỏi kế hoạch" onClick={() => setPlan(plannedKills.filter((k) => k.enemyId !== row.enemyId))}>
                              <Trash2 />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-2 border-t border-line px-4 py-3">
                  <Plus className="h-4 w-4 text-muted" />
                  <Select
                    aria-label="Thêm quái vào kế hoạch"
                    value=""
                    onChange={(e) => e.target.value && setPlan([...plannedKills, { enemyId: e.target.value, killCount: 10 }])}
                    className="max-w-xs"
                  >
                    <option value="">Thêm quái vào kế hoạch...</option>
                    {db.enemies
                      .filter((e) => !plannedKills.some((k) => k.enemyId === e.id))
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </Select>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};
