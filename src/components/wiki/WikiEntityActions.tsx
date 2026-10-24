import React from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { IconButton } from '../common/Button';

interface WikiEntityActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  className?: string;
}

export const WikiEntityActions: React.FC<WikiEntityActionsProps> = ({ onEdit, onDelete, onClose, className = '' }) => (
  <div className={`-mr-2 -mt-1 flex shrink-0 items-center ${className}`}>
    {onEdit && (
      <IconButton label="Sửa" onClick={onEdit}>
        <Pencil />
      </IconButton>
    )}
    {onDelete && (
      <IconButton label="Ẩn / xóa khỏi bách khoa" onClick={onDelete} className="hover:bg-danger-soft hover:text-danger">
        <Trash2 />
      </IconButton>
    )}
    {onClose && (
      <IconButton label="Đóng (Esc)" onClick={onClose}>
        <X />
      </IconButton>
    )}
  </div>
);
