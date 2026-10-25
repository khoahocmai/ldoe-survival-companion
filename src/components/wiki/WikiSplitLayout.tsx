import React, { useEffect } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface WikiSplitLayoutProps {
  listContent: React.ReactNode;
  detailContent: React.ReactNode | null;
  selectedId: string | null;
  onClose: () => void;
  className?: string;
}

export const WIDE_QUERY = '(min-width: 1280px)';

/**
 * List on the left, details on the right. Below 1280px the details open as a drawer instead,
 * so the list never gets squeezed on tablets and phones. Only one of the two is mounted.
 * On wide screens the aside shows whenever `detailContent` is given, which lets a page keep it
 * permanently open; the drawer still needs an explicit `selectedId`.
 */
export const WikiSplitLayout: React.FC<WikiSplitLayoutProps> = ({
  listContent,
  detailContent,
  selectedId,
  onClose,
  className = '',
}) => {
  const isOpen = Boolean(selectedId && detailContent);
  const isWide = useMediaQuery(WIDE_QUERY);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <div className="min-w-0 flex-1">{listContent}</div>

      {isWide && detailContent && (
        <aside aria-label="Chi tiết" className="sticky top-0 h-[calc(100vh-5rem)] w-[400px] shrink-0 animate-slide-in 2xl:w-[440px]">
          {detailContent}
        </aside>
      )}

      {isOpen && !isWide && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết"
            className="relative flex h-full w-full animate-slide-in flex-col bg-surface shadow-pop sm:max-w-lg"
          >
            {detailContent}
          </div>
        </div>
      )}
    </div>
  );
};
