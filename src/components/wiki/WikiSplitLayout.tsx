import React, { useEffect, useState } from 'react';

interface WikiSplitLayoutProps {
  listContent: React.ReactNode;
  detailContent: React.ReactNode | null;
  selectedId: string | null;
  onClose: () => void;
  className?: string;
}

const WIDE_QUERY = '(min-width: 1280px)';

function useIsWide() {
  const [isWide, setIsWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(WIDE_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY);
    const onChange = () => setIsWide(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isWide;
}

/**
 * List on the left, details on the right. Below 1280px the details open as a drawer instead,
 * so the list never gets squeezed on tablets and phones. Only one of the two is mounted.
 */
export const WikiSplitLayout: React.FC<WikiSplitLayoutProps> = ({
  listContent,
  detailContent,
  selectedId,
  onClose,
  className = '',
}) => {
  const isOpen = Boolean(selectedId && detailContent);
  const isWide = useIsWide();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className={`flex items-start gap-6 ${className}`}>
      <div className="min-w-0 flex-1">{listContent}</div>

      {isOpen && isWide && (
        <aside aria-label="Chi tiết" className="sticky top-0 h-[calc(100vh-3.5rem-3.5rem)] w-[420px] shrink-0 animate-slide-in 2xl:w-[460px]">
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
