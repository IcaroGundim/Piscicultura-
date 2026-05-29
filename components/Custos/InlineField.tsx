import { cn } from '@/lib/utils';

interface InlineFieldProps {
  label: string;
  icon?: React.ElementType;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  hint?: string;
}

export default function InlineField({
  label,
  icon: Icon,
  unit,
  value,
  onChange,
  step = '0.01',
  hint,
}: InlineFieldProps) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />}
          {label}
        </span>
        {hint && (
          <span className="text-[10px] tabular-nums text-muted-foreground/70">
            {hint}
          </span>
        )}
      </div>
      <div
        className={cn(
          'flex h-10 items-center gap-1 rounded-lg border border-input bg-card px-3 transition-all',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 focus-within:outline-none'
        )}
      >
        <input
          type="number"
          step={step}
          min={0}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value.replace(',', '.'));
            onChange(Number.isFinite(n) && n >= 0 ? n : 0);
          }}
          className="w-full bg-transparent text-sm font-semibold text-foreground tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit && (
          <span className="shrink-0 select-none text-[11px] font-medium text-muted-foreground/80">
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}
