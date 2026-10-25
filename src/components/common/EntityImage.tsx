import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Modal } from './Modal';

export type ImageFolder = 'items' | 'enemies' | 'locations' | 'quests';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

export const ITEM_IMAGE_SUBFOLDERS = [
  'weapons',
  'armor',
  'tools',
  'workstations',
  'furniture',
  'medical',
  'resources',
  'food',
  'components',
  'special',
] as const;

interface EntityImageProps {
  folder: ImageFolder;
  id: string;
  alt: string;
  /** Optional explicit path/URL from the data; otherwise `public/images/<folder>/<id>.<ext>` is used. */
  image?: string;
  /** Bare thumbnail (fills its parent, no zoom, no text) for lists. */
  compact?: boolean;
}

/** key -> resolved URL, or null when no image exists. Avoids re-probing the same files. */
const resolvedCache = new Map<string, string | null>();

const base = () => {
  const b = import.meta.env.BASE_URL || '/';
  return b.endsWith('/') ? b : `${b}/`;
};

function candidatesFor({ folder, id, image }: Pick<EntityImageProps, 'folder' | 'id' | 'image'>): string[] {
  if (image) {
    return /^(https?:)?\/\//.test(image) || image.startsWith('data:') ? [image] : [`${base()}${image.replace(/^\/+/, '')}`];
  }
  const rootCandidates = EXTENSIONS.map((ext) => `${base()}images/${folder}/${id}.${ext}`);
  if (folder === 'items') {
    const subCandidates = ITEM_IMAGE_SUBFOLDERS.flatMap((sub) =>
      EXTENSIONS.map((ext) => `${base()}images/${folder}/${sub}/${id}.${ext}`)
    );
    return [...subCandidates, ...rootCandidates];
  }
  return rootCandidates;
}

/**
 * Resolves the image file for an entity: undefined = still looking, null = nothing found,
 * string = the first candidate that really is an image.
 */
export function useEntityImageSrc({ folder, id, image }: Pick<EntityImageProps, 'folder' | 'id' | 'image'>) {
  const sources = candidatesFor({ folder, id, image });
  const key = sources.join('|');
  const [src, setSrc] = useState<string | null | undefined>(() => resolvedCache.get(key));

  // Static hosts and the dev server answer unknown paths with index.html (HTTP 200), so <img onError> is
  // not enough: check the content type of each candidate instead.
  useEffect(() => {
    let cancelled = false;
    if (resolvedCache.has(key)) {
      setSrc(resolvedCache.get(key));
      return;
    }
    setSrc(undefined);
    (async () => {
      for (const candidate of sources) {
        // Embedded pictures need no probing (and fetch() refuses HEAD on data: URLs).
        if (candidate.startsWith('data:image/')) {
          if (!cancelled) setSrc(candidate);
          return;
        }
        try {
          const res = await fetch(candidate, { method: 'HEAD' });
          if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')) {
            resolvedCache.set(key, candidate);
            if (!cancelled) setSrc(candidate);
            return;
          }
        } catch {
          /* try the next candidate */
        }
      }
      resolvedCache.set(key, null);
      if (!cancelled) setSrc(null);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return src;
}

/**
 * Shows the screenshot for an entity. Drop a file named after the entity id into
 * `public/images/<folder>/` (png, jpg or webp) and it appears here; until then a small placeholder is shown.
 */
export const EntityImage: React.FC<EntityImageProps> = ({ folder, id, alt, image, compact = false }) => {
  const src = useEntityImageSrc({ folder, id, image });
  const [isOpen, setIsOpen] = useState(false);

  if (compact) {
    return src ? (
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    ) : (
      <span className="block h-full w-full" aria-hidden="true" />
    );
  }

  if (src === undefined) return <div className="h-14 animate-pulse rounded-lg bg-subtle" aria-hidden="true" />;

  if (src === null) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-subtle/50 px-4 text-center text-faint">
        <ImageOff className="h-6 w-6" />
        <div className="text-xs font-medium text-muted">Chưa có ảnh</div>
        <div className="max-w-full truncate text-[11px]" title={image ?? `public/images/${folder}/${id}.png`}>
          Bấm ✎ Sửa để thêm ảnh
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Phóng to ảnh ${alt}`}
        className="block w-full overflow-hidden rounded-lg border border-line bg-subtle"
      >
        <img src={src} alt={alt} loading="lazy" className="max-h-64 w-full object-contain" />
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={alt} maxWidth="2xl">
        <img src={src} alt={alt} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg" />
      </Modal>
    </>
  );
};
