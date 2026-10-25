import React, { useRef, useState } from 'react';
import { ImageOff, ImagePlus, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { ImageFolder, useEntityImageSrc } from './EntityImage';

interface ImageFieldProps {
  folder: ImageFolder;
  id: string;
  /** Current `image` value of the entity: a path under /public or an embedded data URL. */
  value?: string;
  onChange: (image: string | undefined) => void;
}

const MAX_SIDE = 960;

/**
 * Shrinks the picked file and returns it as a data URL, so it fits in browser storage
 * next to the rest of the user's edits (a raw screenshot would not).
 */
async function toCompactDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = canvas.toDataURL('image/webp', 0.85);
  // Browsers without WebP encoding silently hand back a PNG.
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
}

/** Picture slot for the edit dialogs: preview, pick a file, or clear it. */
export const ImageField: React.FC<ImageFieldProps> = ({ folder, id, value, onChange }) => {
  const src = useEntityImageSrc({ folder, id, image: value });
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      onChange(await toCompactDataUrl(file));
    } catch {
      setError('Không đọc được file này, hãy thử ảnh PNG hoặc JPG.');
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted">Ảnh</span>
      <div className="flex items-center gap-3">
        <div className="flex aspect-video w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-subtle text-faint">
          {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-5 w-5" />}
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" icon={<ImagePlus />} onClick={() => inputRef.current?.click()}>
              {value ? 'Đổi ảnh' : 'Chọn ảnh'}
            </Button>
            {value && (
              <Button type="button" variant="secondary" size="sm" icon={<Trash2 />} onClick={() => onChange(undefined)}>
                Gỡ ảnh
              </Button>
            )}
          </div>
          <p className="text-xs text-faint">
            {error || (value ? 'Ảnh được lưu cùng chỉnh sửa trong trình duyệt này.' : `Hoặc đặt file vào public/images/${folder}/${id}.png`)}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
};
