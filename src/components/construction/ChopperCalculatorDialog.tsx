import React, { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { StructureCycleItem } from '../../types';
import { useGameData } from '../../context/DataContext';
import {
  calculateChopperUpgrade,
  getChopperRequiredExp,
  getOptimalJunkCombo,
} from '../../lib/calculators/chopperCalculator';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Field, NumberInput } from '../common/Field';
import { Callout, ProgressBar, Stat, StatGrid } from '../common/Layout';
import { Modal } from '../common/Modal';
import { EntityImage } from '../common/EntityImage';

interface ChopperCalculatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  acceptedItems: StructureCycleItem[];
}

/** Works out how many levels the Chopper gains from a planned donation. Keeps its inputs while the page stays open. */
export const ChopperCalculatorDialog: React.FC<ChopperCalculatorDialogProps> = ({ isOpen, onClose, acceptedItems }) => {
  const { db } = useGameData();
  const [level, setLevel] = useState(42);
  const [exp, setExp] = useState(3610);
  const [donations, setDonations] = useState<Record<string, number>>({});

  const requiredExp = getChopperRequiredExp(level);
  const expPercent = requiredExp > 0 ? Math.min(100, Math.round((exp / requiredExp) * 100)) : 100;

  const result = useMemo(
    () => calculateChopperUpgrade({ currentLevel: level, currentExp: exp, donations, acceptedItems }),
    [level, exp, donations, acceptedItems]
  );

  const setDonation = (itemId: string, value: number, dailyLimit?: number) => {
    const capped = dailyLimit ? Math.max(0, Math.min(dailyLimit, value)) : Math.max(0, value);
    setDonations((prev) => {
      const next = { ...prev };
      if (capped > 0) next[itemId] = capped;
      else delete next[itemId];
      return next;
    });
  };

  if (!db) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <span className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-accent" />
          Máy tính nâng cấp xe Chopper (Jane)
        </span>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="sm" icon={<RotateCcw />} onClick={() => setDonations({})}>
            Đặt lại số lượng
          </Button>
          <Button size="sm" onClick={onClose}>
            Hoàn tất
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-3 rounded-card border border-line bg-subtle/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Trạng thái xe</span>
            <Badge tone="accent">Cấp 1 - 100</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Cấp độ xe hiện tại">
              <NumberInput
                min={1}
                max={100}
                value={level}
                onValueChange={(val) => {
                  const next = Math.max(1, Math.min(100, val));
                  setLevel(next);
                  setExp((prev) => Math.min(prev, getChopperRequiredExp(next)));
                }}
              />
            </Field>

            <Field label="EXP hiện tại" hint={`Cần ${requiredExp.toLocaleString()} EXP để lên cấp`}>
              <NumberInput
                min={0}
                max={requiredExp}
                value={exp}
                onValueChange={(val) => setExp(Math.max(0, Math.min(requiredExp, val)))}
              />
            </Field>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted">
              <span>Tiến trình cấp hiện tại</span>
              <span className="num">
                {exp.toLocaleString()} / {requiredExp.toLocaleString()} EXP ({expPercent}%)
              </span>
            </div>
            <ProgressBar percent={expPercent} />
          </div>
        </div>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Kết quả dự kiến sau khi nộp</h4>
            {result.levelsGained > 0 && (
              <Badge tone="ok">
                <CheckCircle2 className="h-3.5 w-3.5" />+{result.levelsGained} cấp độ
              </Badge>
            )}
          </div>

          <StatGrid cols={3}>
            <Stat label="Tổng EXP nộp" value={`+${result.totalExpGained.toLocaleString()}`} tone="accent" unit="EXP" />
            <Stat
              label="Cấp dự kiến"
              value={`Lv. ${result.newLevel}`}
              tone={result.levelsGained > 0 ? 'ok' : 'neutral'}
              hint={result.levelsGained > 0 ? `Tăng +${result.levelsGained} cấp` : 'Chưa lên cấp'}
            />
            <Stat
              label={result.isLevelUpSatisfied ? 'Trạng thái' : 'Còn thiếu'}
              value={result.isLevelUpSatisfied ? 'Đủ lên cấp' : result.remainingExpToNextLevel.toLocaleString()}
              tone={result.isLevelUpSatisfied ? 'ok' : 'neutral'}
              unit={result.isLevelUpSatisfied ? undefined : 'EXP'}
            />
          </StatGrid>

          {result.levelsGained > 0 ? (
            <Callout tone="ok">
              <div className="text-xs">
                Tăng từ <strong>Lv. {result.currentLevel}</strong> lên <strong>Lv. {result.newLevel}</strong>! Bạn sẽ nhận
                được <strong>{result.perkRollsAvailable}</strong> lượt chọn kỹ năng mới.
              </div>
            </Callout>
          ) : (
            <Callout tone="info">
              <div className="text-xs">
                Còn thiếu <strong>{result.remainingExpToNextLevel.toLocaleString()} EXP</strong> nữa để đạt cấp{' '}
                {result.currentLevel + 1}.
              </div>
            </Callout>
          )}
        </Card>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">Nhập số lượng đồ dự kiến nộp</h4>
              <p className="text-xs text-muted">Bấm &quot;Gợi ý combo&quot; để điền nhanh các món rác thừa thông dụng.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles className="text-accent" />}
              onClick={() => setDonations(getOptimalJunkCombo(acceptedItems))}
            >
              Gợi ý combo tiết kiệm
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {acceptedItems.map((item) => {
              const meta = db.itemsMap.get(item.itemId);
              const name = meta?.vietnameseName || meta?.name || item.itemId;
              const amount = donations[item.itemId] ?? 0;

              return (
                <div
                  key={item.itemId}
                  className={`flex flex-col justify-between rounded-control border p-2.5 transition-colors ${
                    amount > 0 ? 'border-accent-solid/60 bg-accent-soft/20' : 'border-line bg-subtle/40 hover:bg-subtle'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-10 w-10 shrink-0 rounded-md border border-line bg-surface p-1">
                      <EntityImage folder="items" id={item.itemId} alt={name} compact />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-semibold">{name}</span>
                        {item.tier === 'recommended' && <Badge tone="ok">Tiết kiệm</Badge>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-muted">
                        <span className="font-semibold text-accent">+{item.valuePerItem} EXP</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.dailyLimit ? `Tối đa ${item.dailyLimit}` : 'Vô hạn'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="min-w-0 flex-1">
                      <NumberInput
                        aria-label={`Số ${name} nộp`}
                        min={0}
                        max={item.dailyLimit}
                        value={amount}
                        onValueChange={(val) => setDonation(item.itemId, val, item.dailyLimit)}
                        className="h-control-sm text-xs"
                        placeholder="0"
                      />
                    </div>
                    {item.dailyLimit && (
                      <Button
                        variant={amount === item.dailyLimit ? 'primary' : 'secondary'}
                        size="sm"
                        className="shrink-0 px-2.5"
                        onClick={() => setDonation(item.itemId, item.dailyLimit!, item.dailyLimit)}
                      >
                        Max
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
