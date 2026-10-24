import React from 'react';
import { WikiEntityActions } from './WikiEntityActions';

interface WikiDetailHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
  className?: string;
}

export const WikiDetailHeader: React.FC<WikiDetailHeaderProps> = ({
  title,
  subtitle,
  badges,
  onEdit,
  onDelete,
  onClose,
  className = '',
}) => (
  <div className={`flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3 ${className}`}>
    <div className="min-w-0 flex-1">
      <h2 className="truncate text-lg font-semibold leading-tight">{title}</h2>
      {subtitle && <div className="mt-0.5 truncate text-sm text-muted">{subtitle}</div>}
      {badges && <div className="mt-2 flex flex-wrap items-center gap-1.5">{badges}</div>}
    </div>
    <WikiEntityActions onEdit={onEdit} onDelete={onDelete} onClose={onClose} />
  </div>
);
