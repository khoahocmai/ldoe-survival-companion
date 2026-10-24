import React from 'react';
import { Pencil, Trash2, Zap } from 'lucide-react';
import { Item, WeaponMod } from '../../types';
import { Badge } from '../common/Badge';
import { IconButton } from '../common/Button';
import { WEAPON_MOD_RARITY_LABEL, WEAPON_MOD_RARITY_TONE } from '../../lib/labels';
import { modStatChips } from './modStats';

interface ModOptionProps {
  mod: WeaponMod;
  selected: boolean;
  itemsMap: Map<string, Item>;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const chipTone = {
  neutral: 'bg-subtle text-muted',
  accent: 'bg-accent-soft text-accent',
  ok: 'bg-ok-soft text-ok',
  info: 'bg-info-soft text-info',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
} as const;

/** One selectable mod in a slot. The selected one opens up to show materials, source and edit actions. */
export const ModOption: React.FC<ModOptionProps> = ({ mod, selected, itemsMap, onToggle, onEdit, onDelete }) => {
  const chips = modStatChips(mod.stats);

  return (
    <li
      className={`rounded-lg border transition-colors ${
        selected ? 'border-accent-solid bg-accent-soft/40' : 'border-line bg-surface hover:border-faint/60'
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onToggle}
        className="flex w-full items-start gap-3 rounded-lg p-3 text-left"
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            selected ? 'border-accent-solid bg-accent-solid' : 'border-faint'
          }`}
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-accent-fg" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold">{mod.name}</span>
            <Badge tone={WEAPON_MOD_RARITY_TONE[mod.rarity]}>{WEAPON_MOD_RARITY_LABEL[mod.rarity]}</Badge>
            {mod.isCustom && <Badge tone="info">Tùy chỉnh</Badge>}
          </span>
          {mod.vietnameseName && mod.vietnameseName !== mod.name && (
            <span className="block text-xs text-muted">{mod.vietnameseName}</span>
          )}

          {chips.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className={`num inline-flex gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${chipTone[chip.tone]}`}
                >
                  <span className="font-normal opacity-80">{chip.label}</span>
                  {chip.text}
                </span>
              ))}
            </span>
          )}

          {mod.activeSkill && (
            <span className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent">
              <Zap className="h-3.5 w-3.5 shrink-0" />
              {mod.activeSkill}
            </span>
          )}
        </span>
      </button>

      {selected && (
        <div className="space-y-2.5 border-t border-line/70 px-3 pb-3 pt-2.5 pl-10">
          {mod.description && <p className="text-xs leading-relaxed text-muted">{mod.description}</p>}

          {mod.materials.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-medium text-faint">Nguyên liệu</div>
              <ul className="flex flex-wrap gap-1.5">
                {mod.materials.map((mat) => (
                  <li key={mat.itemId} className="num rounded bg-subtle px-1.5 py-0.5 text-xs">
                    {itemsMap.get(mat.itemId)?.name ?? mat.itemId} <span className="font-semibold text-accent">×{mat.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mod.obtainDescription && (
            <p className="text-xs text-muted">
              <span className="text-faint">Nguồn bản vẽ: </span>
              {mod.obtainDescription}
            </p>
          )}

          <div className="-ml-2 flex gap-1">
            <IconButton label="Sửa bản độ" onClick={onEdit} className="h-8 w-8">
              <Pencil />
            </IconButton>
            <IconButton label="Xóa bản độ" onClick={onDelete} className="h-8 w-8 hover:bg-danger-soft hover:text-danger">
              <Trash2 />
            </IconButton>
          </div>
        </div>
      )}
    </li>
  );
};
