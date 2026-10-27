import React from 'react';
import { cn } from '../../lib/cn';
import { Tooltip } from './Tooltip';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  /** Stretch to the full width of the container. */
  block?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const sizes = {
  sm: 'h-control-sm coarse:h-10 px-3 text-xs rounded-control',
  md: 'h-control coarse:h-11 px-4 text-sm rounded-control',
  lg: 'h-control-lg coarse:h-12 px-5 text-sm rounded-control',
};

const variants = {
  primary: 'bg-accent-solid text-accent-fg hover:brightness-90 active:brightness-75',
  secondary: 'bg-surface text-fg border border-line hover:bg-subtle',
  soft: 'bg-accent-soft text-accent hover:brightness-95',
  ghost: 'text-muted hover:text-fg hover:bg-subtle',
  danger: 'bg-danger text-white hover:brightness-110 dark:text-surface',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  block,
  className = '',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={cn(base, sizes[size], variants[variant], block && 'w-full', className)}
    {...props}
  >
    {icon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
    {children}
  </button>
);

/** Square icon-only button used for toolbars and dialog close buttons. */
export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: React.ReactNode }
> = ({ label, children, className = '', type = 'button', ...props }) => (
  <Tooltip label={label}>
    <button
      type={type}
      aria-label={label}
      className={cn('inline-flex h-control w-control coarse:h-11 coarse:w-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-subtle hover:text-fg [&>svg]:h-4 [&>svg]:w-4', className)}
      {...props}
    >
      {children}
    </button>
  </Tooltip>
);
