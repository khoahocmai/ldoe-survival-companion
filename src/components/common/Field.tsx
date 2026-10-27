import React from 'react';
import { controlClass } from './controlStyles';

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/** Label + control + optional hint. Wraps the control in a <label> so clicking the text focuses it. */
export const Field: React.FC<FieldProps> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
  </label>
);

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} type="text" className={`${controlClass} h-control ${className}`} {...props} />
  )
);
TextInput.displayName = 'TextInput';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | undefined;
  onValueChange: (value: number) => void;
}

/** Numeric input that never yields NaN: an empty field reports 0. */
export const NumberInput: React.FC<NumberInputProps> = ({ value, onValueChange, className = '', min = 0, ...props }) => (
  <input
    type="number"
    inputMode="numeric"
    min={min}
    value={value ?? ''}
    onChange={(e) => {
      const parsed = parseFloat(e.target.value);
      onValueChange(Number.isFinite(parsed) ? parsed : 0);
    }}
    className={`${controlClass} num h-control ${className}`}
    {...props}
  />
);

/** Native select with the same chevron on every OS (the arrow is drawn by `.select-control` in index.css). */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <select ref={ref} className={`${controlClass} select-control h-control pr-9 ${className}`} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={`${controlClass} py-2 ${className}`} {...props} />
  )
);
Textarea.displayName = 'Textarea';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  /** Accessible name; the visible label is usually rendered by the caller next to the value. */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  className?: string;
}

/** Range input with a filled track, so the chosen amount reads at a glance. */
export const Slider: React.FC<SliderProps> = ({ value, onChange, label, min = 0, max = 100, step = 1, id, className = '' }) => {
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      id={id}
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ '--range-progress': `${progress}%` } as React.CSSProperties}
      className={`range-control ${className}`}
    />
  );
};

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3 transition-colors hover:bg-subtle has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-solid/40">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent-solid))]"
    />
    <span>
      <span className="block text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </span>
  </label>
);

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

/** On/off setting that applies immediately (as opposed to a checkbox that is part of a form). */
export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, hint }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-3 rounded-control border border-line bg-surface p-3 text-left transition-colors hover:bg-subtle"
  >
    <span>
      <span className="block text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </span>
    <span
      aria-hidden="true"
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent-solid' : 'bg-raised'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow-card transition-transform ${
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
        }`}
      />
    </span>
  </button>
);
