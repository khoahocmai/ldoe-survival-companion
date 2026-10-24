import React from 'react';

export type Tone = 'neutral' | 'accent' | 'ok' | 'info' | 'warn' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export const toneStyles: Record<Tone, string> = {
  neutral: 'bg-subtle text-muted',
  accent: 'bg-accent-soft text-accent',
  ok: 'bg-ok-soft text-ok',
  info: 'bg-info-soft text-info',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
};

const sizeStyles = {
  sm: 'text-[11px] px-1.5 py-0.5 rounded',
  md: 'text-xs px-2 py-1 rounded-md',
};

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'neutral', size = 'sm', className = '', title }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 whitespace-nowrap font-medium leading-none ${sizeStyles[size]} ${toneStyles[tone]} ${className}`}
  >
    {children}
  </span>
);
