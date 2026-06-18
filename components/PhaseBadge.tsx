import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';

// Badges preenchidos: fundo na cor da fase + texto branco para máximo contraste.
// O text-shadow garante legibilidade mesmo nas fases de cor mais clara (ex.: berçário).
const phaseStyles: Record<TankPhase, string> = {
  bercario: 'border-white/40 bg-(--phase-bercario) text-white',
  recria: 'border-white/40 bg-(--phase-recria)/80 text-white',
  engorda: 'border-white/40 bg-(--phase-engorda) text-white',
  vazio: 'border-white/40 bg-zinc-500 text-white',
};

const phaseDotStyles: Record<TankPhase, string> = {
  bercario: 'bg-white',
  recria: 'bg-white',
  engorda: 'bg-white',
  vazio: 'bg-white',
};

interface PhaseBadgeProps {
  phase: TankPhase;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  asButton?: boolean;
  showDot?: boolean;
  /** Mostra a seta e afordância de hover, indicando que a fase pode ser alterada. */
  editable?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
}

export default function PhaseBadge({
  phase,
  size = 'md',
  className,
  asButton,
  showDot = false,
  editable = false,
  onClick,
  onKeyDown,
}: PhaseBadgeProps) {
  const baseClasses = cn(
    'group/phase inline-flex items-center justify-center gap-1.5 rounded-full border font-semibold shadow-sm transition-all duration-200',
    '[text-shadow:0_1px_1.5px_rgba(0,0,0,0.28)]',
    size === 'sm' && 'text-xs px-2.5 py-0.5',
    size === 'md' && 'text-sm px-3 py-1',
    size === 'lg' && 'text-base px-3.5 py-1.5',
    phaseStyles[phase],
    editable && 'cursor-pointer hover:brightness-95 hover:shadow',
    asButton && 'focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer',
    className
  );

  const chevronSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  const content = (
    <>
      {showDot && !editable && phase !== 'vazio' && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', phaseDotStyles[phase])} />
      )}
      {PHASE_LABELS[phase]}
      {editable && (
        <ChevronDown
          className={cn(
            chevronSize,
            'shrink-0 -mr-0.5 opacity-75 transition-all duration-200 group-hover/phase:opacity-100 group-hover/phase:translate-y-px'
          )}
        />
      )}
    </>
  );

  if (asButton) {
    return (
      <button type="button" className={baseClasses} onClick={onClick} onKeyDown={onKeyDown}>
        {content}
      </button>
    );
  }

  return <span className={baseClasses}>{content}</span>;
}
