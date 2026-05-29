import { cn } from '@/lib/utils';

interface LedgerRowProps {
  sign: '+' | '−' | '=';
  label: string;
  value: number;
  onChange?: (v: number) => void;
  tone?: 'neutral' | 'positive' | 'negative';
  percent?: number;
  editable?: boolean;
}

export default function LedgerRow({
  sign,
  label,
  value,
  onChange,
  tone = 'neutral',
  percent,
  editable = true,
}: LedgerRowProps) {
  const signColor =
    tone === 'positive'
      ? 'text-emerald-600'
      : tone === 'negative'
      ? 'text-red-500'
      : 'text-muted-foreground';

  const valueColor =
    tone === 'positive'
      ? 'text-emerald-700'
      : tone === 'negative'
      ? 'text-red-700'
      : 'text-foreground';

  return (
    <div
      className={cn(
        'group grid grid-cols-[16px_1fr_auto_44px] items-center gap-2 px-3 py-2 transition-colors',
        editable && 'hover:bg-muted/40 focus-within:bg-muted/60'
      )}
    >
      <span className={cn('text-sm font-bold tabular-nums', signColor)}>{sign}</span>
      <span className="truncate text-sm font-medium text-foreground">{label}</span>
      {editable && onChange ? (
        <div className="flex items-center gap-1 rounded-md border border-transparent px-1.5 transition-all group-hover:border-input group-focus-within:border-ring group-focus-within:ring-2 group-focus-within:ring-ring/30">
          <span className="text-[10px] text-muted-foreground/70">R$</span>
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
              'w-28 bg-transparent text-right text-sm font-bold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              valueColor
            )}
          />
        </div>
      ) : (
        <span className={cn('px-1.5 text-sm font-bold tracking-tight tabular-nums', valueColor)}>
          R$ {value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </span>
      )}
      <span className="text-right text-[11px] tabular-nums text-muted-foreground">
        {percent !== undefined && Number.isFinite(percent) ? `${percent.toFixed(1)}%` : ''}
      </span>
    </div>
  );
}
