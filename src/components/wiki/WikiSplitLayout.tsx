import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Dialog } from '../common/Dialog';

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

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <div className="min-w-0 flex-1">{listContent}</div>

      {isWide && detailContent && (
        <aside aria-label="Chi tiết" className="sticky top-0 h-[calc(100vh-5rem)] w-[400px] shrink-0 animate-slide-in 2xl:w-[440px]">
          {detailContent}
        </aside>
      )}

      <Dialog isOpen={isOpen && !isWide} onClose={onClose} variant="drawer-right" label="Chi tiết" className="sm:max-w-lg">
        {detailContent}
      </Dialog>
    </div>
  );
};
