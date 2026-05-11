import { cn } from '@/lib/utils';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { Fish, Sprout, Scale, CircleOff } from 'lucide-react';

const phaseIcons: Record<TankPhase, typeof Fish> = {
  bercario: Fish,
  recria: Sprout,
  engorda: Scale,
  vazio: CircleOff,
};

const phaseStyles: Record<TankPhase, string> = {
  bercario: 'border-blue-400/30 bg-blue-400/10 text-blue-700/90',
  recria: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-700/90',
  engorda: 'border-amber-400/30 bg-amber-400/10 text-amber-700/90',
  vazio: 'border-slate-400/30 bg-slate-400/10 text-slate-600/90',
};

interface PhaseBadgeProps {
  phase: TankPhase;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  asButton?: boolean;
  showDot?: boolean;
}

export default function PhaseBadge({ phase, size = 'md', className, asButton, showDot = false }: PhaseBadgeProps) {
  const Icon = phaseIcons[phase];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        size === 'lg' && 'text-base px-3 py-1.5',
        phaseStyles[phase],
        asButton && 'focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer',
        className
      )}
    >
      {showDot && phase !== 'vazio' && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
      )}
      <Icon className={cn('shrink-0', size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      {PHASE_LABELS[phase]}
    </span>
  );
}
