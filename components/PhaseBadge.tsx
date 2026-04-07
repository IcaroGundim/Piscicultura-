import { cn } from '@/lib/utils';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';

interface PhaseBadgeProps {
  phase: TankPhase;
  size?: 'sm' | 'md';
  className?: string;
}

const phaseStyles: Record<TankPhase, string> = {
  bercario: 'border-blue-200/80 bg-blue-50/80 text-blue-700',
  recria:   'border-emerald-200/80 bg-emerald-50/80 text-emerald-700',
  engorda:  'border-orange-200/80 bg-orange-50/80 text-orange-700',
  vazio:    'border-slate-200/90 bg-slate-100/90 text-slate-600',
};

const phaseDots: Record<TankPhase, string> = {
  bercario: 'bg-blue-500',
  recria:   'bg-green-500',
  engorda:  'bg-amber-500',
  vazio:    'bg-slate-400',
};

export default function PhaseBadge({ phase, size = 'md', className }: PhaseBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium shadow-xs',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        phaseStyles[phase],
        className
      )}
    >
      <span className={cn('rounded-full shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', phaseDots[phase])} />
      {PHASE_LABELS[phase]}
    </span>
  );
}
