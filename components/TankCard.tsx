'use client';

import { forwardRef, useState } from 'react';
import type { Tank, TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import PhaseBadge from './PhaseBadge';
import PhaseChangeMenu from './PhaseChangeMenu';
import { Droplets, Ruler, Fish, Scale } from 'lucide-react';
import TankDeleteButton from './TankDeleteButton';
import { useStore } from '@/lib/store';
import {
  getPhaseBorderColor,
  getPhaseGlowColor,
  getPhaseSelectedBg,
  getPhaseTopAccent,
} from '@/lib/phase-utils';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

interface TankCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tank: Tank;
  isSelected?: boolean;
  animationDelay?: number;
}

const TankCard = forwardRef<HTMLDivElement, TankCardProps>(function TankCard({
  tank,
  isSelected,
  animationDelay = 0,
  ...rest
}, ref) {
  const [isPhasePopoverOpen, setIsPhasePopoverOpen] = useState(false);

  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);
  const updateTankPhase = useStore((s) => s.updateTankPhase);

  const lote =
    tank.phase === 'bercario'
      ? bercarioLotes.find((l) => l.tankId === tank.id)
      : tank.phase === 'recria'
      ? recriaLotes.find((l) => l.tankId === tank.id)
      : tank.phase === 'engorda'
      ? engordaLotes.find((l) => l.tankId === tank.id)
      : undefined;

  const hasLote = !!lote;

  const handlePhaseChange = (newPhase: TankPhase) => {
    if (newPhase === tank.phase) {
      setIsPhasePopoverOpen(false);
      return;
    }

    if (newPhase === 'vazio' && hasLote) {
      const ok = window.confirm(
        'Mudar para Vazio removerá os dados do lote atual. Deseja continuar?'
      );
      if (!ok) return;
    } else if (hasLote) {
      const ok = window.confirm(
        `Mudar a fase para ${PHASE_LABELS[newPhase]} migrará o lote atual. Deseja continuar?`
      );
      if (!ok) return;
    }

    updateTankPhase(tank.id, newPhase);
    setIsPhasePopoverOpen(false);
  };

  return (
    <div
      ref={ref}
      data-tank-id={tank.id}
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left transition-all duration-300',
        'tank-card-enter',
        'bg-card/95 backdrop-blur-sm',
        getPhaseBorderColor(tank.phase),
        getPhaseGlowColor(tank.phase),
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        'hover:shadow-lg hover:-translate-y-1',
        isSelected && [
          getPhaseSelectedBg(tank.phase),
          'ring-2 ring-primary ring-offset-2 shadow-lg shadow-primary/20',
        ]
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
      {...rest}
    >
      {/* Faixa superior colorida */}
      <div className={cn('absolute inset-x-0 top-0 h-1 rounded-t-2xl ', getPhaseTopAccent(tank.phase))} />

      {/* Delete button - only visible on hover */}
      <TankDeleteButton tankId={tank.id} />

      <div className="p-4 pt-5">
        {/* Header: ID + Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center rounded-lg bg-muted/30 text-foreground font-bold text-sm border border-border shadow-sm font-heading px-2.5 py-1">
              Tanque {tank.id}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Popover open={isPhasePopoverOpen} onOpenChange={setIsPhasePopoverOpen}>
              <PopoverTrigger
                render={
                  <button type="button" className="inline-flex cursor-pointer" />
                }
              >
                <PhaseBadge phase={tank.phase} size="sm" editable />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" side="bottom" sideOffset={6}>
                <PhaseChangeMenu currentPhase={tank.phase} onSelect={handlePhaseChange} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {tank.area_m2.toLocaleString('pt-BR')}
              <span className="ml-0.5 text-xs text-muted-foreground">m²</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-primary/80" />
            <span className="text-sm font-medium text-foreground">
              {tank.area_ha}
              <span className="ml-0.5 text-xs text-muted-foreground">ha</span>
            </span>
          </div>
        </div>

        {/* Lote metrics */}
        {tank.phase !== 'vazio' && (
          <div className="space-y-2">
            {hasLote ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/70 px-2.5 py-1">
                    <Fish className="h-3.5 w-3.5 text-primary/80" />
                    <span className="text-sm font-semibold text-foreground">
                      {(lote.qtd_peixes ?? 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/70 px-2.5 py-1">
                    <Scale className="h-3.5 w-3.5 text-primary/80" />
                    <span className="text-sm font-semibold text-foreground">
                      {(lote.peso_total_kg ?? 0).toLocaleString('pt-BR')} kg
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <span className="inline-flex items-center rounded-full border border-muted bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Sem lote
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default TankCard;
