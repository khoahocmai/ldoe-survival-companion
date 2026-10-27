import React, { useMemo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import manifest from 'virtual:image-manifest';
import { Modal } from './Modal';

export type ImageFolder = 'items' | 'enemies' | 'locations' | 'quests';

interface EntityImageProps {
  folder: ImageFolder;
  id: string;
  alt: string;
  /** Optional explicit path/URL from the data; otherwise a file named after `id` under `public/images/<folder>/` is used. */
  image?: string;
  /** Bare thumbnail (fills its parent, no zoom, no text) for lists. */
  compact?: boolean;
}

const KNOWN_FILES = new Set(manifest.files);

const base = () => {
  const b = import.meta.env.BASE_URL || '/';
  return b.endsWith('/') ? b : `${b}/`;
};

/**
 * Finds the picture for an entity without touching the network: the build lists every file in
 * `public/images`, so a missing picture is known immediately instead of after a round of failed requests.
 */
function resolveImage({ folder, id, image }: Pick<EntityImageProps, 'folder' | 'id' | 'image'>): string | null {
  if (image) {
    if (/^(https?:)?\/\//.test(image) || image.startsWith('data:')) return image;
    const path = image.replace(/^\/+/, '');
    // A path into images/ that does not exist falls through to the lookup by id instead of showing a broken picture.
    if (!path.startsWith('images/') || KNOWN_FILES.has(path)) return `${base()}${path}`;
  }
  const file = manifest.byId[`${folder}/${id}`];
  return file ? `${base()}${file}` : null;
}

/** URL of the entity's picture, or null when it has none. */
export function useEntityImageSrc({ folder, id, image }: Pick<EntityImageProps, 'folder' | 'id' | 'image'>) {
  return useMemo(() => resolveImage({ folder, id, image }), [folder, id, image]);
}

/**
 * Shows the screenshot for an entity. Drop a file named after the entity id anywhere under
 * `public/images/<folder>/` (png, jpg or webp) and it appears here; until then a small placeholder is shown.
 */
export const EntityImage: React.FC<EntityImageProps> = ({ folder, id, alt, image, compact = false }) => {
  const src = useEntityImageSrc({ folder, id, image });
  const [isOpen, setIsOpen] = useState(false);

  if (compact) {
    return src ? (
      <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
    ) : (
      <span className="block h-full w-full" aria-hidden="true" />
    );
  }

  if (src === null) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-subtle/50 px-4 text-center text-faint">
        <ImageOff className="h-6 w-6" />
        <div className="text-xs font-medium text-muted">Chưa có ảnh</div>
        <div className="max-w-full truncate text-2xs" title={image ?? `public/images/${folder}/${id}.png`}>
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
        <img src={src} alt={alt} decoding="async" className="max-h-64 w-full object-contain" />
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={alt} maxWidth="2xl">
        <img src={src} alt={alt} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg" />
      </Modal>
    </>
  );
};
