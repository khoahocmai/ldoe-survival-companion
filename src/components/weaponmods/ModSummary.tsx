import React from 'react';
import { ArrowRight, Calculator, Layers, Zap } from 'lucide-react';
import { Item } from '../../types';
import { ModdedMaterialAggregate, ModdedWeaponResult } from '../../lib/calculators/weaponModCalculator';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EntityImage } from '../common/EntityImage';
import { Callout, Section } from '../common/Layout';

interface ModSummaryProps {
  weapon: Item;
  stats: ModdedWeaponResult;
  materials: ModdedMaterialAggregate[];
  equippedCount: number;
  slotCount: number;
  itemsMap: Map<string, Item>;
  onOpenCombat: () => void;
  onOpenPlanner: () => void;
}

const deltaClass = (value: number, lowerIsBetter = false) =>
  value === 0 ? 'text-faint' : (lowerIsBetter ? value < 0 : value > 0) ? 'text-ok' : 'text-danger';

const fmtDelta = (value: number) => (value > 0 ? `+${value}` : String(value));

interface Row {
  label: string;
  base: number | string;
  value: number | string;
  delta: number;
  strong?: boolean;
  lowerIsBetter?: boolean;
}

/** Before / after table of the modded weapon, the combined material list and the hand-off buttons. */
export const ModSummary: React.FC<ModSummaryProps> = ({
  weapon,
  stats,
  materials,
  equippedCount,
  slotCount,
  itemsMap,
  onOpenCombat,
  onOpenPlanner,
}) => {
  const rows: Row[] = [
    { label: 'Sát thương', base: stats.baseDamage, value: stats.damage, delta: stats.damageDelta },
    { label: 'Tốc đánh', base: `${stats.baseAttackSpeed}/s`, value: `${stats.attackSpeed}/s`, delta: stats.attackSpeedDelta },
    { label: 'DPS', base: stats.baseDps, value: stats.dps, delta: stats.dpsDelta, strong: true },
    { label: 'Độ bền', base: stats.baseDurability, value: stats.durability, delta: stats.durabilityDelta },
  ];

  const extras = [
    { label: 'Tỉ lệ chí mạng', value: stats.critChance, unit: '%' },
    { label: 'Sát thương chí mạng', value: stats.critDamage, unit: '%' },
    { label: 'Độ ổn định', value: stats.stability, unit: '' },
    { label: 'Độ ồn', value: stats.noise, unit: '%', lowerIsBetter: true },
  ].filter((e) => e.value !== 0);

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-subtle">
            <EntityImage folder="items" id={weapon.id} image={weapon.image} alt={weapon.name} compact />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold leading-tight">{weapon.name}</h2>
            {weapon.vietnameseName && <p className="truncate text-xs text-muted">{weapon.vietnameseName}</p>}
            <p className="num mt-0.5 text-xs font-medium text-accent">
              Đã lắp {equippedCount}/{slotCount} vị trí
            </p>
          </div>
        </div>

        <Section title="Chỉ số sau khi độ">
          <dl className="divide-y divide-line rounded-lg border border-line text-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-muted">{row.label}</dt>
                <dd className="num flex items-center gap-1.5">
                  <span className="text-faint">{row.base}</span>
                  <ArrowRight className="h-3 w-3 text-faint" />
                  <span className={`font-semibold ${row.strong ? 'text-accent' : ''}`}>{row.value}</span>
                  <span className={`w-12 text-right text-xs ${deltaClass(row.delta)}`}>
                    {row.delta === 0 ? '—' : fmtDelta(row.delta)}
                  </span>
                </dd>
              </div>
            ))}
            {extras.map((e) => (
              <div key={e.label} className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-muted">{e.label}</dt>
                <dd className={`num font-semibold ${deltaClass(e.value, e.lowerIsBetter)}`}>
                  {fmtDelta(e.value)}
                  {e.unit}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        {stats.activeSkills.length > 0 && (
          <Callout tone="accent" icon={<Zap />}>
            <div className="font-medium">Kỹ năng đặc biệt</div>
            <ul className="mt-0.5 list-disc pl-4 text-xs">
              {stats.activeSkills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </Callout>
        )}

        <div className="space-y-2">
          <Button block icon={<Calculator />} onClick={onOpenCombat}>
            Tính hạ quái với bản độ này
          </Button>
          <Button block variant="secondary" icon={<Layers />} onClick={onOpenPlanner} disabled={materials.length === 0}>
            Gom nguyên liệu sang kế hoạch chế tạo
          </Button>
        </div>
      </Card>

      <Card padded={false}>
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Tổng nguyên liệu</h3>
          <span className="num text-xs text-muted">{materials.length} loại</span>
        </div>
        {materials.length === 0 ? (
          <p className="border-t border-line px-4 py-5 text-center text-xs text-muted">Chọn bản độ để xem nguyên liệu cần có.</p>
        ) : (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto border-t border-line text-sm">
            {materials.map((mat) => (
              <li key={mat.itemId} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0 truncate">
                  {mat.itemName}
                  {itemsMap.get(mat.itemId)?.vietnameseName && (
                    <span className="ml-1.5 text-xs text-faint">{itemsMap.get(mat.itemId)?.vietnameseName}</span>
                  )}
                </span>
                <span className="num shrink-0 font-semibold text-accent">×{mat.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
