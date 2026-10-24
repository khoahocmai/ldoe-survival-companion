import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  highlight?: 'amber' | 'olive' | 'hazard' | 'none';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  highlight = 'none',
  onClick,
}) => {
  const highlightStyles = {
    none: 'border-charcoal-800',
    amber: 'border-amber-600/40 shadow-sm shadow-amber-950/20',
    olive: 'border-[#656d4a]/40 shadow-sm shadow-[#1c222c]/40',
    hazard: 'border-red-600/40 shadow-sm shadow-red-950/20',
  };

  const hoverStyles = hoverable
    ? 'hover:border-charcoal-700 hover:bg-charcoal-850 hover:shadow-md transition-all cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-charcoal-900 border rounded-lg p-4 sm:p-5 text-slate-200 ${highlightStyles[highlight]} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};
