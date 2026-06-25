import { formatBRL } from '@/lib/format';

interface TooltipItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}

/** Tooltip escuro padrão dos gráficos, com valores em BRL. */
export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="space-y-1 rounded-xl bg-slate-900/90 p-3 text-xs text-white shadow-xl">
      {label && <p className="font-semibold">{label}</p>}
      {payload.map((item, idx) => (
        <p key={idx} className="flex items-center gap-2 text-slate-200">
          {item.color && (
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.name}:{' '}
          <span className="font-bold text-white">{formatBRL(Number(item.value) || 0)}</span>
        </p>
      ))}
    </div>
  );
}
