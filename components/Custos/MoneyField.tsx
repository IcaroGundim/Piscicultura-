import { cn } from '@/lib/utils';

interface MoneyFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent?: 'emerald' | 'amber' | 'sky' | 'slate';
  size?: 'sm' | 'lg';
  hint?: string;
}

export default function MoneyField({
  label,
  value,
  onChange,
  accent,
  size = 'sm',
  hint,
}: MoneyFieldProps) {
  const accentRing: Record<NonNullable<typeof accent>, string> = {
    emerald: 'focus-within:ring-emerald-500/30 focus-within:border-emerald-500/60',
    amber: 'focus-within:ring-amber-500/30 focus-within:border-amber-500/60',
    sky: 'focus-within:ring-sky-500/30 focus-within:border-sky-500/60',
    slate: 'focus-within:ring-slate-500/30 focus-within:border-slate-500/60',
  };

  const accentDot: Record<NonNullable<typeof accent>, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    slate: 'bg-slate-500',
  };

  const isLg = size === 'lg';

  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {accent && (
            <span className={cn('h-2 w-2 rounded-full', accentDot[accent])} />
          )}
          {label}
        </span>
        {hint && (
          <span className="text-[10px] text-muted-foreground/70 tabular-nums">{hint}</span>
        )}
      </div>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-xl border border-input bg-card/80 shadow-sm transition-all',
          'focus-within:ring-3 focus-within:outline-none',
          accent ? accentRing[accent] : 'focus-within:ring-ring/40 focus-within:border-ring',
          isLg ? 'h-12 px-3.5' : 'h-10 px-3'
        )}
      >
        <span
          className={cn(
            'shrink-0 font-semibold text-muted-foreground/80 select-none',
            isLg ? 'text-sm' : 'text-xs'
          )}
        >
          R$
        </span>
        <input
          type="number"
          step="1000"
          min={0}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value.replace(',', '.'));
            onChange(Number.isFinite(n) && n >= 0 ? n : 0);
          }}
          className={cn(
            'w-full bg-transparent text-right font-bold text-foreground tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            isLg ? 'text-lg' : 'text-sm'
          )}
        />
      </div>
    </label>
  );
}
