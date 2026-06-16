import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import {
  getPhaseDotColor,
  getPhaseHoverBg,
  getPhaseSelectedBg,
  getPhaseTextColor,
} from '@/lib/phase-utils';
import { cn } from '@/lib/utils';

const PHASE_OPTIONS: TankPhase[] = ['bercario', 'recria', 'engorda', 'vazio'];

interface PhaseChangeMenuProps {
  currentPhase: TankPhase;
  onSelect: (phase: TankPhase) => void;
  /** Ref aplicado ao botão da fase ativa, para receber foco ao abrir. */
  firstItemRef?: React.Ref<HTMLButtonElement>;
}

const PhaseChangeMenu = forwardRef<HTMLDivElement, PhaseChangeMenuProps>(
  function PhaseChangeMenu({ currentPhase, onSelect, firstItemRef }, ref) {
    return (
      <div ref={ref}>
        <p className="border-b border-border/60 px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Alterar fase
        </p>
        <div className="mt-1 space-y-0.5">
          {PHASE_OPTIONS.map((phase) => {
            const isActive = phase === currentPhase;
            return (
              <button
                key={phase}
                ref={isActive ? firstItemRef : undefined}
                type="button"
                onClick={() => onSelect(phase)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150',
                  isActive
                    ? cn(getPhaseSelectedBg(phase), 'font-semibold text-foreground')
                    : cn('text-foreground/90', getPhaseHoverBg(phase))
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', getPhaseDotColor(phase))} />
                  {PHASE_LABELS[phase]}
                </span>
                {isActive && <Check className={cn('h-4 w-4 shrink-0', getPhaseTextColor(phase))} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

export default PhaseChangeMenu;
