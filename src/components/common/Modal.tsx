import React, { useId } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { Dialog } from './Dialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Accessible name for dialogs without a visible title. */
  label?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const widths = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, label, children, footer, maxWidth = 'lg' }) => {
  const titleId = useId();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      variant="center"
      labelledBy={title ? titleId : undefined}
      label={label}
      className={widths[maxWidth]}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h3 id={titleId} className="flex min-w-0 items-center gap-2 text-base font-semibold">
            {title}
          </h3>
          <IconButton label="Đóng" onClick={onClose} className="-mr-2">
            <X />
          </IconButton>
        </div>
      )}
      <div data-dialog-body className="flex-1 overflow-y-auto px-5 py-4">
        {children}
      </div>
      {footer && <div className="flex justify-end gap-2 border-t border-line bg-subtle/50 px-5 py-3">{footer}</div>}
    </Dialog>
  );
};
