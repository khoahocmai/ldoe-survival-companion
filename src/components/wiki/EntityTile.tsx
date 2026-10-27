import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Tone } from '../common/Badge';
import { ImageFolder, useEntityImageSrc } from '../common/EntityImage';
import { Tooltip } from '../common/Tooltip';

interface EntityTileProps {
  folder: ImageFolder;
  id: string;
  name: string;
  /** Shown as a tooltip only, so the tile itself stays name + picture. */
  hint?: string;
  image?: string;
  /** Shown above the name while there is no picture. */
  icon?: LucideIcon;
  /** Colours a thin bar on the tile's top edge (rarity, danger...) so the grid can be scanned at a glance. */
  tone?: Tone;
  isSelected?: boolean;
  onClick: () => void;
}

const TONE_BAR: Record<Tone, string> = {
  neutral: '',
  accent: 'bg-accent-solid',
  ok: 'bg-ok',
  info: 'bg-info',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

/**
 * Square tile for the wiki grids, in the spirit of the in-game blueprint list: just the name and,
 * when a picture exists, the picture behind it. Everything else lives in the always-visible detail panel.
 */
export const EntityTile: React.FC<EntityTileProps> = ({
  folder,
  id,
  name,
  hint,
  image,
  icon: Icon,
  tone,
  isSelected = false,
  onClick,
}) => {
  const src = useEntityImageSrc({ folder, id, image });

  return (
    <Tooltip label={hint ? `${name} · ${hint}` : name}>
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`relative aspect-square overflow-hidden rounded-lg border bg-subtle text-left transition-colors ${
        isSelected ? 'border-accent-solid ring-2 ring-accent-solid' : 'border-line hover:border-faint/60'
      }`}
    >
      {tone && tone !== 'neutral' && (
        <span aria-hidden="true" className={`absolute inset-x-0 top-0 z-raised h-1 ${TONE_BAR[tone]}`} />
      )}
      {src && (
        // The screenshots are wide blueprint cards; zooming in on the centre keeps the item and drops the frame and top title.
        <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-[1.85] object-cover" />
      )}
      <span
        className={`absolute font-medium leading-tight ${
          src
            ? 'inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-1.5 pb-1 pt-6 text-xs text-white'
            : `inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center text-sm ${isSelected ? 'text-accent' : ''}`
        }`}
      >
        {!src && Icon && <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-faint" />}
        <span className={src ? 'line-clamp-2' : Icon ? 'line-clamp-3' : 'line-clamp-4'}>{name}</span>
      </span>
    </button>
    </Tooltip>
  );
};
