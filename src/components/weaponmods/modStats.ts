import { WeaponModStatBonus } from '../../types';
import { Tone } from '../common/Badge';

export interface StatChip {
  key: keyof WeaponModStatBonus;
  label: string;
  text: string;
  tone: Tone;
}

interface StatMeta {
  key: keyof WeaponModStatBonus;
  label: string;
  unit: string;
  /** A lower value is the better one (noise). */
  lowerIsBetter?: boolean;
  /** Always shown in one colour regardless of sign. */
  fixedTone?: Tone;
}

const STAT_META: StatMeta[] = [
  { key: 'damage', label: 'Sát thương', unit: '' },
  { key: 'attackSpeed', label: 'Tốc đánh', unit: '/s' },
  { key: 'durability', label: 'Độ bền', unit: '' },
  { key: 'critChance', label: 'Chí mạng', unit: '%', fixedTone: 'accent' },
  { key: 'critDamage', label: 'Dmg chí mạng', unit: '%', fixedTone: 'accent' },
  { key: 'range', label: 'Tầm', unit: '' },
  { key: 'stability', label: 'Ổn định', unit: '', fixedTone: 'info' },
  { key: 'noise', label: 'Độ ồn', unit: '%', lowerIsBetter: true },
];

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** The non-zero bonuses of a mod as small coloured chips, in a fixed order. */
export function modStatChips(stats: WeaponModStatBonus): StatChip[] {
  const chips: StatChip[] = [];
  for (const meta of STAT_META) {
    const value = stats[meta.key];
    if (typeof value !== 'number' || value === 0) continue;
    const good = meta.lowerIsBetter ? value < 0 : value > 0;
    chips.push({
      key: meta.key,
      label: meta.label,
      text: `${signed(value)}${meta.unit}`,
      tone: good ? (meta.fixedTone ?? 'ok') : 'danger',
    });
  }
  return chips;
}
