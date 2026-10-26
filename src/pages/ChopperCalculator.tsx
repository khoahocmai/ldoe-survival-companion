import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Sparkles, RotateCcw, MapPin, AlertTriangle, CheckCircle2, Award, Info } from 'lucide-react';
import { useGameData } from '../context/DataContext';
import {
  calculateChopperUpgrade,
  getChopperRequiredExp,
  getOptimalJunkCombo,
  DEFAULT_CHOPPER_ACCEPTED_ITEMS,
} from '../lib/calculators/chopperCalculator';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EntityImage } from '../components/common/EntityImage';
import { Field, NumberInput } from '../components/common/Field';
import { Callout, PageHeader, ProgressBar, Section, Stat, StatGrid } from '../components/common/Layout';

const TIER_BADGE = {
  recommended: { tone: 'ok' as const, label: 'Nên nộp' },
  caution: { tone: 'warn' as const, label: 'Cân nhắc' },
  avoid: { tone: 'danger' as const, label: 'Tránh nộp' },
};

export const ChopperCalculator: React.FC = () => {
  const { db } = useGameData();

  // Find chopper structure configuration from locationStructures if loaded
  const chopperStructure = useMemo(
    () => db?.locationStructures.find((s) => s.id === 'struct_gas_station_chopper'),
    [db]
  );

  const acceptedItems = chopperStructure?.cycleConfig?.acceptedItems ?? DEFAULT_CHOPPER_ACCEPTED_ITEMS;
  const perkGuide = chopperStructure?.cycleConfig?.perkGuide ?? [
    {
      name: 'Trunk Capacity (Mở rộng cốp xe)',
      tier: 'S',
      description: 'Mở rộng thêm số ô chứa đồ trong cốp xe máy (tối đa 8 ô). Đây là ưu tiên số 1 tuyệt đối!',
    },
    {
      name: 'Fuel Economy (Tiết kiệm xăng)',
      tier: 'A',
      description: 'Giảm lượng xăng tiêu thụ khi di chuyển trên bản đồ thế giới, giúp tiết kiệm tài nguyên xăng đáng kể.',
    },
    {
      name: 'Fuel Tank (Dung tích bình xăng)',
      tier: 'B',
      description: 'Tăng lượng xăng tối đa có thể chứa trong bình xe máy, tiện lợi cho các hành trình dài ngày.',
    },
    {
      name: 'Impact Power (Sát thương đâm tông)',
      tier: 'C',
      description: 'Tăng sát thương khi lái xe húc vào zombie (ít khi dùng vì vừa hao xăng vừa hỏng xe).',
    },
  ];

  // Starting state defaults to Lvl 42 with 3610 EXP as shown in common gameplay
  const [currentLevel, setCurrentLevel] = useState<number>(42);
  const [currentExp, setCurrentExp] = useState<number>(3610);
  const [donations, setDonations] = useState<Record<string, number>>({});

  const requiredExp = getChopperRequiredExp(currentLevel);
  const expProgressPercent = requiredExp > 0 ? Math.min(100, Math.round((currentExp / requiredExp) * 100)) : 100;

  const result = useMemo(
    () =>
      calculateChopperUpgrade({
        currentLevel,
        currentExp,
        donations,
        acceptedItems,
      }),
    [currentLevel, currentExp, donations, acceptedItems]
  );

  const handleDonationChange = (itemId: string, value: number, dailyLimit?: number) => {
    const capped = dailyLimit ? Math.max(0, Math.min(dailyLimit, value)) : Math.max(0, value);
    setDonations((prev) => {
      const next = { ...prev };
      if (capped > 0) {
        next[itemId] = capped;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleMaxItem = (itemId: string, dailyLimit?: number) => {
    if (dailyLimit) {
      handleDonationChange(itemId, dailyLimit, dailyLimit);
    }
  };

  const handleSelectOptimalJunk = () => {
    const junkCombo = getOptimalJunkCombo(acceptedItems);
    setDonations(junkCombo);
  };

  const handleReset = () => {
    setDonations({});
  };

  return (
    <div>
      <PageHeader
        title="Nâng cấp xe Chopper"
        description="Tính toán lượng EXP nộp hàng ngày cho nữ thợ máy Jane tại Trạm xăng (Gas Station), tối ưu hóa nguyên liệu nộp và cẩm nang kỹ năng."
        icon={<Bike />}
        actions={
          <Link to="/wiki/locations?select=gas_station">
            <Button variant="secondary" size="sm">
              <MapPin className="h-4 w-4" />
              Xem Trạm xăng
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT COLUMN: Input & Jane's Daily Donations */}
        <div className="space-y-4 lg:col-span-7">
          {/* Card 1: Current Bike Status */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Trạng thái xe Chopper hiện tại</h2>
              <Badge tone="accent">Cấp 1 - 100</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cấp độ hiện tại">
                <NumberInput
                  min={1}
                  max={100}
                  value={currentLevel}
                  onValueChange={(val) => {
                    const l = Math.max(1, Math.min(100, val));
                    setCurrentLevel(l);
                    setCurrentExp((prev) => Math.min(prev, getChopperRequiredExp(l)));
                  }}
                />
              </Field>

              <Field
                label="EXP hiện tại"
                hint={`Cần ${requiredExp.toLocaleString()} EXP để lên cấp`}
              >
                <NumberInput
                  min={0}
                  max={requiredExp}
                  value={currentExp}
                  onValueChange={(val) => setCurrentExp(Math.max(0, Math.min(requiredExp, val)))}
                />
              </Field>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted">
                <span>Tiến trình cấp hiện tại</span>
                <span>
                  {currentExp.toLocaleString()} / {requiredExp.toLocaleString()} EXP ({expProgressPercent}%)
                </span>
              </div>
              <ProgressBar percent={expProgressPercent} tone="accent" />
            </div>
          </Card>

          {/* Card 2: Jane's Daily Donations Grid */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">Bảng nộp nguyên liệu cho Jane</h2>
                  <Badge tone="info">Reset mỗi 24 giờ</Badge>
                </div>
                <p className="text-xs text-muted">Mỗi ngày Jane chỉ nhận số lượng tối đa theo hạn mức của từng món.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleSelectOptimalJunk} title="Tự động điền hạn mức các món đồ rác thừa dồi dào">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Gợi ý combo rác
                </Button>
                {Object.keys(donations).length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleReset} title="Xóa toàn bộ số lượng đang chọn">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Xóa
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {acceptedItems.map((item) => {
                const itemMeta = db?.itemsMap.get(item.itemId);
                const itemName = itemMeta?.name ?? item.itemId;
                const vietnameseName = itemMeta?.vietnameseName;
                const currentDonation = donations[item.itemId] ?? 0;
                const isAvoid = item.tier === 'avoid';
                const isRecommended = item.tier === 'recommended';

                const tierInfo = TIER_BADGE[item.tier];

                return (
                  <div
                    key={item.itemId}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 transition-colors ${
                      currentDonation > 0
                        ? isAvoid
                          ? 'border-danger/50 bg-danger-soft/20'
                          : 'border-accent-solid/60 bg-accent-soft/20'
                        : 'border-line bg-subtle/50 hover:bg-subtle'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-surface p-1">
                        <EntityImage folder="items" id={item.itemId} alt={itemName} compact />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-semibold" title={itemName}>
                            {vietnameseName || itemName}
                          </span>
                          <Badge tone={tierInfo.tone} size="sm">
                            {tierInfo.label}
                          </Badge>
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                          <span className="font-semibold text-accent">+{item.valuePerItem} EXP</span>
                          <span>·</span>
                          <span>
                            Hạn mức: {item.dailyLimit ? `${item.dailyLimit}/ngày` : 'Vô hạn'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5">
                      <div className="min-w-0 flex-1">
                        <NumberInput
                          min={0}
                          max={item.dailyLimit}
                          value={currentDonation}
                          onValueChange={(val) => handleDonationChange(item.itemId, val, item.dailyLimit)}
                          className="h-8 text-xs"
                          placeholder="0"
                        />
                      </div>

                      {item.dailyLimit && (
                        <Button
                          variant={currentDonation === item.dailyLimit ? 'primary' : 'secondary'}
                          size="sm"
                          className="h-8 px-2.5 text-xs shrink-0"
                          onClick={() => handleMaxItem(item.itemId, item.dailyLimit)}
                        >
                          Max
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Results & Recommendations */}
        <div className="space-y-4 lg:col-span-5">
          {/* Card 1: Upgrade Results */}
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold">Kết quả dự kiến sau khi nộp</h2>

            <StatGrid cols={2}>
              <Stat
                label="Tổng EXP nhận được"
                value={`+${result.totalExpGained.toLocaleString()}`}
                tone="accent"
                unit="EXP"
              />
              <Stat
                label="Cấp xe dự kiến"
                value={`Lv. ${result.newLevel}`}
                tone={result.levelsGained > 0 ? 'ok' : 'neutral'}
                hint={result.levelsGained > 0 ? `+${result.levelsGained} cấp độ!` : 'Chưa đủ lên cấp'}
              />
              <Stat
                label="Lượt quay Perk nhận"
                value={result.perkRollsAvailable}
                tone={result.perkRollsAvailable > 0 ? 'info' : 'neutral'}
                unit="lượt"
                hint={result.perkRollsAvailable > 0 ? 'Chọn kỹ năng mới' : undefined}
              />
              <Stat
                label="EXP dư sang cấp sau"
                value={`${result.newExp.toLocaleString()} / ${result.requiredExpForNewLevel.toLocaleString()}`}
                hint={
                  result.requiredExpForNewLevel > 0
                    ? `${Math.round((result.newExp / result.requiredExpForNewLevel) * 100)}%`
                    : 'Đã đạt max cấp'
                }
              />
            </StatGrid>

            {result.levelsGained > 0 && (
              <Callout tone="ok">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Chúc mừng! Bạn sẽ tăng từ Lv. {result.currentLevel} lên Lv. {result.newLevel}!
                </div>
                <p className="mt-1 text-xs">
                  Bạn nhận được <strong>{result.perkRollsAvailable}</strong> lần quay chọn kỹ năng mới cho xe Chopper.
                </p>
              </Callout>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-2">
                {result.warnings.map((warning) => (
                  <Callout
                    key={warning.itemId}
                    tone={warning.severity === 'danger' ? 'danger' : 'warn'}
                  >
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold">
                          {warning.severity === 'danger' ? 'Cảnh báo lãng phí tài nguyên quý!' : 'Lưu ý cân nhắc:'}
                        </div>
                        <div className="mt-0.5 text-xs">{warning.message}</div>
                      </div>
                    </div>
                  </Callout>
                ))}
              </div>
            )}
          </Card>

          {/* Card 2: Chopper Perks Tier List */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold">Cẩm nang chọn Kỹ năng (Perks)</h2>
              </div>
              <Badge tone="neutral">Tier List</Badge>
            </div>
            <p className="text-xs text-muted">
              Mỗi khi lên cấp, Jane sẽ cho chọn ngẫu nhiên 1 trong 3 kỹ năng. Dưới đây là thứ tự ưu tiên tối ưu nhất:
            </p>

            <div className="space-y-2">
              {perkGuide.map((perk) => {
                const tierTone =
                  perk.tier === 'S' ? 'ok' : perk.tier === 'A' ? 'accent' : perk.tier === 'B' ? 'info' : 'neutral';

                return (
                  <div key={perk.name} className="rounded-lg border border-line bg-subtle/50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{perk.name}</span>
                      <Badge tone={tierTone} size="sm">
                        Tier {perk.tier}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{perk.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-line bg-surface p-2.5 text-xs text-muted">
              <div className="flex items-center gap-1 font-semibold text-fg">
                <Info className="h-3.5 w-3.5 text-accent" />
                Mẹo cho tân thủ:
              </div>
              <p className="mt-1">
                Luôn lấy <strong>Cốp xe (Trunk Capacity)</strong> bất cứ khi nào xuất hiện cho đến khi đạt tối đa 8 ô.
                Sau đó hãy dồn hết vào <strong>Tiết kiệm xăng (Fuel Economy)</strong> để đi farm khắp bản đồ mà không lo cạn bình xăng!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
