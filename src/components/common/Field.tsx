import React from 'react';

const control =
  'w-full rounded-control border border-line bg-surface px-3 text-sm placeholder:text-faint focus:border-accent-solid focus:outline-none disabled:opacity-60';

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
    <input ref={ref} type="text" className={`${control} h-control ${className}`} {...props} />
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
    className={`${control} num h-control ${className}`}
    {...props}
  />
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <select ref={ref} className={`${control} h-control pr-8 ${className}`} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={`${control} py-2 ${className}`} {...props} />
  )
);
Textarea.displayName = 'Textarea';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-3 hover:bg-subtle">
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
