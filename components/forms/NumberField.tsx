import { cn } from '@/lib/utils';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: string;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  step = '0.01',
  min = 0,
  max = 1_000_000_000,
  className,
  disabled,
  error,
  required,
}: NumberFieldProps) {
  const safeChange = (raw: string) => {
    const n = parseFloat(raw.replace(',', '.'));
    if (!Number.isFinite(n) || n < min || n > max) {
      onChange(0);
      return;
    }
    onChange(n);
  };

  const errorId = error ? `${label}-error` : undefined;

  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs text-muted-foreground uppercase tracking-wider">
        {label}{' '}
        {unit && <span className="text-muted-foreground/70 normal-case">({unit})</span>}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => safeChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={errorId}
        className={cn(
          'h-9 w-full rounded-xl border bg-card px-3 text-sm text-foreground shadow-sm transition-colors',
          'border-input',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40'
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
