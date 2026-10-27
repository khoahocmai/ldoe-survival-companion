import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Makes the whole card a keyboard accessible button. */
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  selected = false,
  disabled = false,
  padded = true,
}) => {
  const interactive = Boolean(onClick) && !disabled;

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`rounded-card border bg-surface shadow-card transition-colors ${padded ? 'p-3.5' : ''} ${
        selected ? 'border-accent-solid ring-1 ring-accent-solid' : 'border-line'
      } ${interactive ? 'cursor-pointer hover:border-faint/60' : ''} ${disabled ? 'opacity-60' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
