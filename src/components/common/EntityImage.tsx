import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Modal } from './Modal';

export type ImageFolder = 'items' | 'enemies' | 'locations' | 'quests';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

interface EntityImageProps {
  folder: ImageFolder;
  id: string;
  alt: string;
  /** Optional explicit path/URL from the data; otherwise `public/images/<folder>/<id>.<ext>` is used. */
  image?: string;
}

const base = () => {
  const b = import.meta.env.BASE_URL || '/';
  return b.endsWith('/') ? b : `${b}/`;
};

function candidatesFor({ folder, id, image }: Pick<EntityImageProps, 'folder' | 'id' | 'image'>): string[] {
  if (image) {
    return /^(https?:)?\/\//.test(image) || image.startsWith('data:') ? [image] : [`${base()}${image.replace(/^\/+/, '')}`];
  }
  return EXTENSIONS.map((ext) => `${base()}images/${folder}/${id}.${ext}`);
}

/**
 * Shows the screenshot for an entity. Drop a file named after the entity id into
 * `public/images/<folder>/` (png, jpg or webp) and it appears here; until then a small placeholder is shown.
 */
export const EntityImage: React.FC<EntityImageProps> = ({ folder, id, alt, image }) => {
  const sources = candidatesFor({ folder, id, image });
  const key = sources.join('|');
  // undefined = still looking, null = nothing found, string = the first candidate that really is an image.
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  // Static hosts and the dev server answer unknown paths with index.html (HTTP 200), so <img onError> is
  // not enough: check the content type of each candidate instead.
  useEffect(() => {
    let cancelled = false;
    setSrc(undefined);
    (async () => {
      for (const candidate of sources) {
        try {
          const res = await fetch(candidate, { method: 'HEAD' });
          if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')) {
            if (!cancelled) setSrc(candidate);
            return;
          }
        } catch {
          /* try the next candidate */
        }
      }
      if (!cancelled) setSrc(null);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (src === undefined) return <div className="h-14 animate-pulse rounded-lg bg-subtle" aria-hidden="true" />;

  if (src === null) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-line px-3 py-3 text-faint">
        <ImageOff className="h-5 w-5 shrink-0" />
        <div className="min-w-0 text-xs">
          <div className="font-medium text-muted">Chưa có ảnh</div>
          <div className="truncate font-mono">{image ?? `public/images/${folder}/${id}.png`}</div>
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
