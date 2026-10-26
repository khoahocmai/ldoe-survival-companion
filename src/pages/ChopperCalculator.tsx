import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Sparkles, RotateCcw, MapPin, CheckCircle2, Award, Info, HelpCircle } from 'lucide-react';
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
import { Callout, PageHeader, ProgressBar, Stat, StatGrid } from '../components/common/Layout';

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
        description="Tra cứu dữ liệu nguyên liệu nộp cho Jane tại Trạm xăng (Gas Station), tính toán lượng EXP và kiểm tra số lượng cần để lên cấp."
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
              <h2 className="text-sm font-semibold">Cấp độ xe hiện tại</h2>
              <Badge tone="accent">Cấp 1 - 100</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cấp hiện tại">
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
                hint={`Cần ${requiredExp.toLocaleString()} EXP để đạt cấp kế`}
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
                <span>Tiến trình hiện tại</span>
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
                  <h2 className="text-sm font-semibold">Danh sách nguyên liệu nộp cho Jane</h2>
                  <Badge tone="info">Reset mỗi 24h</Badge>
                </div>
                <p className="text-xs text-muted">Nhập số lượng bạn có hoặc bấm Max để kiểm tra lượng EXP nhận được.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleSelectOptimalJunk} title="Điền nhanh các món đồ rác thừa thông dụng">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Gợi ý combo tiết kiệm
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
                const isRecommended = item.tier === 'recommended';

                return (
                  <div
                    key={item.itemId}
                    className={`flex flex-col justify-between rounded-lg border p-2.5 transition-colors ${
                      currentDonation > 0
                        ? 'border-accent-solid/60 bg-accent-soft/20'
                        : 'border-line bg-subtle/40 hover:bg-subtle'
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
                          {isRecommended && (
                            <Badge tone="ok" size="sm">
                              Tiết kiệm
                            </Badge>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                          <span className="font-semibold text-accent">+{item.valuePerItem} EXP</span>
                          <span>·</span>
                          <span>
                            {item.dailyLimit ? `Tối đa: ${item.dailyLimit}/ngày` : 'Vô hạn'}
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

        {/* RIGHT COLUMN: Results & Wiki Advice */}
        <div className="space-y-4 lg:col-span-5">
          {/* Card 1: Upgrade Results & Requirement Check */}
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold">Tiến độ & Kết quả dự kiến</h2>

            <StatGrid cols={2}>
              <Stat
                label="Tổng EXP nộp"
                value={`+${result.totalExpGained.toLocaleString()}`}
                tone="accent"
                unit="EXP"
              />
              <Stat
                label={result.isLevelUpSatisfied ? 'Trạng thái' : 'Còn thiếu để lên cấp'}
                value={
                  result.isLevelUpSatisfied
                    ? 'Đủ lên cấp!'
                    : `${result.remainingExpToNextLevel.toLocaleString()}`
                }
                tone={result.isLevelUpSatisfied ? 'ok' : 'neutral'}
                unit={result.isLevelUpSatisfied ? undefined : 'EXP'}
                hint={
                  result.isLevelUpSatisfied
                    ? `Dư ${result.newExp.toLocaleString()} EXP sang cấp sau`
                    : `Cần nộp thêm ${result.remainingExpToNextLevel.toLocaleString()} EXP`
                }
              />
              <Stat
                label="Cấp dự kiến"
                value={`Lv. ${result.newLevel}`}
                tone={result.levelsGained > 0 ? 'ok' : 'neutral'}
                hint={result.levelsGained > 0 ? `+${result.levelsGained} cấp độ` : 'Chưa lên cấp'}
              />
              <Stat
                label="Lượt chọn Perk"
                value={result.perkRollsAvailable}
                tone={result.perkRollsAvailable > 0 ? 'info' : 'neutral'}
                unit="lượt"
                hint={result.perkRollsAvailable > 0 ? 'Chọn kỹ năng mới' : undefined}
              />
            </StatGrid>

            {result.levelsGained > 0 ? (
              <Callout tone="ok">
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Đủ nguyên liệu tăng từ Lv. {result.currentLevel} lên Lv. {result.newLevel} (+{result.levelsGained} cấp)!
                </div>
                <p className="mt-1 text-xs">
                  Bạn nhận được <strong>{result.perkRollsAvailable}</strong> lượt quay chọn kỹ năng mới.
                </p>
              </Callout>
            ) : (
              <Callout tone="info">
                <div className="flex items-center gap-1.5 text-xs">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>
                    Còn thiếu <strong>{result.remainingExpToNextLevel.toLocaleString()} EXP</strong> nữa để đạt cấp {result.currentLevel + 1}.
                  </span>
                </div>
              </Callout>
            )}
          </Card>

          {/* Card 2: Wiki Resource Optimization Tips */}
          <Card className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Info className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">Gợi ý tối ưu tài nguyên (Wiki)</h2>
            </div>

            <div className="space-y-2 text-xs text-muted leading-relaxed">
              <div className="rounded-lg border border-line bg-subtle/40 p-2.5">
                <div className="font-semibold text-fg">🟢 Nhóm nguyên liệu dồi dào nên ưu tiên:</div>
                <p className="mt-0.5">
                  <strong>Ốc vít (Bolts)</strong>, <strong>Vòng bi (Bearings)</strong> và <strong>Sắt tấm (Iron Plates)</strong> rất dễ kiếm số lượng lớn khi đi farm bãi rác, Bunker Alfa hoặc dùng máy Tái chế (Recycler). Nộp hết hạn mức 3 món này mỗi ngày đã được <strong>+850 EXP</strong>.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-subtle/40 p-2.5">
                <div className="font-semibold text-fg">🔵 Phụ tùng Chopper thừa & Tạp chí:</div>
                <p className="mt-0.5">
                  Bánh xe, Càng trước và Bình xăng sau khi hoàn thiện Chopper chỉ chiếm chỗ trong hòm; nộp cho Jane cho tới <strong>+500 EXP/món</strong>. Tạp chí xe máy cho <strong>+1,000 EXP</strong> không giới hạn lượt.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-subtle/40 p-2.5">
                <div className="font-semibold text-fg">💡 Lưu ý với tài nguyên chế tạo cao cấp:</div>
                <p className="mt-0.5">
                  Thỏi đồng (Copper Bar) cần cho luyện Thép, Nhôm tấm và Lò xo cần cho việc độ mod súng, còn Linh kiện động cơ (Engine Parts) rất cần thiết để đóng xe ATV và Bồn rửa axit. Người chơi thường ưu tiên giữ lại các món này cho việc chế tạo trước khi nộp EXP.
                </p>
              </div>
            </div>
          </Card>

          {/* Card 3: Chopper Perks Tier List */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold">Thứ tự ưu tiên Kỹ năng (Perks)</h2>
              </div>
              <Badge tone="neutral">Tham khảo</Badge>
            </div>
            <p className="text-xs text-muted">
              Mỗi khi lên cấp, bạn được chọn 1 trong 3 kỹ năng ngẫu nhiên. Thứ tự khuyến nghị từ cộng đồng:
            </p>

            <div className="space-y-2">
              {perkGuide.map((perk) => {
                const tierTone =
                  perk.tier === 'S' ? 'ok' : perk.tier === 'A' ? 'accent' : perk.tier === 'B' ? 'info' : 'neutral';

                return (
                  <div key={perk.name} className="rounded-lg border border-line bg-subtle/30 p-2.5">
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
          </Card>
        </div>
      </div>
    </div>
  );
};
