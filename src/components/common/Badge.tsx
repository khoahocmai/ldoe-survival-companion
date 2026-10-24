import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'olive' | 'charcoal' | 'red' | 'blue' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'charcoal',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    amber: 'bg-amber-950/70 text-amber-400 border border-amber-600/40',
    olive: 'bg-olive-900/60 text-[#a3b18a] border border-[#656d4a]/50',
    charcoal: 'bg-charcoal-800 text-slate-300 border border-charcoal-700',
    red: 'bg-red-950/70 text-red-400 border border-red-700/50',
    blue: 'bg-blue-950/70 text-blue-400 border border-blue-600/40',
    gray: 'bg-slate-800 text-slate-400 border border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-xs font-medium px-2.5 py-1 rounded-md tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
