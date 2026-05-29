import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  tone?: 'neutral' | 'positive' | 'negative';
}

export default function KpiCard({
  label,
  value,
  sublabel,
  tone = 'neutral',
}: KpiCardProps) {
  const toneClasses =
    tone === 'positive'
      ? 'text-emerald-600'
      : tone === 'negative'
      ? 'text-red-600'
      : 'text-foreground';

  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={cn('text-xl font-bold font-heading mt-1 tabular-nums', toneClasses)}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}
