import { cn } from '@/lib/utils';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';

const phaseStyles: Record<TankPhase, string> = {
  bercario: 'border-(--phase-bercario)/40 bg-(--phase-bercario)/14 text-[#2d4518]/95',
  recria: 'border-(--phase-recria)/30 bg-(--phase-recria)/10 text-(--phase-recria)/95',
  engorda: 'border-(--phase-engorda)/35 bg-(--phase-engorda)/12 text-[#1e3a8a]/95',
  vazio: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600/90',
};

const phaseDotStyles: Record<TankPhase, string> = {
  bercario: 'bg-(--phase-bercario)',
  recria: 'bg-(--phase-recria)',
  engorda: 'bg-(--phase-engorda)',
  vazio: 'bg-zinc-500',
};

interface PhaseBadgeProps {
  phase: TankPhase;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  asButton?: boolean;
  showDot?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
}

export default function PhaseBadge({ phase, size = 'md', className, asButton, showDot = false, onClick, onKeyDown }: PhaseBadgeProps) {
  const baseClasses = cn(
    'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200',
    size === 'sm' && 'text-xs px-2 py-0.5',
    size === 'md' && 'text-sm px-2.5 py-1',
    size === 'lg' && 'text-base px-3 py-1.5',
    phaseStyles[phase],
    asButton && 'focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer',
    className
  );

  if (asButton) {
    return (
      <button
        type="button"
        className={baseClasses}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {showDot && phase !== 'vazio' && (
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', phaseDotStyles[phase])} />
        )}
        {PHASE_LABELS[phase]}
      </button>
    );
  }

  return (
    <span
      className={baseClasses}
    >
      {showDot && phase !== 'vazio' && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', phaseDotStyles[phase])} />
      )}
      {PHASE_LABELS[phase]}
    </span>
  );
}
