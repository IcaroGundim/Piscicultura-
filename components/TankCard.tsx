'use client';

import type { Tank } from '@/lib/types';
import { cn } from '@/lib/utils';
import PhaseBadge from './PhaseBadge';
import { Droplets, Ruler, Fish, Scale } from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  getPhaseBorderColor,
  getPhaseGlowColor,
  getPhaseSelectedBg,
  getPhaseTopAccent,
} from '@/lib/phase-utils';

interface TankCardProps {
  tank: Tank;
  isSelected?: boolean;
  onClick: () => void;
  animationDelay?: number;
}

export default function TankCard({
  tank,
  isSelected,
  onClick,
  animationDelay = 0,
}: TankCardProps) {
  const bercarioLotes = useStore((s) => s.bercarioLotes);
  const recriaLotes = useStore((s) => s.recriaLotes);
  const engordaLotes = useStore((s) => s.engordaLotes);

  const lote =
    tank.phase === 'bercario'
      ? bercarioLotes.find((l) => l.tankId === tank.id)
      : tank.phase === 'recria'
      ? recriaLotes.find((l) => l.tankId === tank.id)
      : tank.phase === 'engorda'
      ? engordaLotes.find((l) => l.tankId === tank.id)
      : undefined;

  const hasLote = !!lote;

  return (
    <button
      data-tank-id={tank.id}
      onClick={onClick}
      className={cn(
        'group relative w-full cursor-pointer rounded-2xl border text-left transition-all duration-300',
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
    >
      {/* Faixa superior colorida */}
      <div className={cn('h-1.5 w-full bg-gradient-to-r to-transparent', getPhaseTopAccent(tank.phase))} />

      <div className="p-4">
        {/* Header: ID + Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-bold text-sm text-foreground font-heading">
              {tank.id.toString().padStart(2, '0')}
            </span>
            {tank.subfase && (
              <span className="text-xs font-medium text-muted-foreground truncate max-w-[80px]" title={tank.subfase}>
                {tank.subfase}
              </span>
            )}
          </div>
          <PhaseBadge phase={tank.phase} size="sm" />
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground">{tank.area_m2.toLocaleString('pt-BR')} m²</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3 w-3 text-primary/60" />
            <span className="text-xs text-muted-foreground">{tank.area_ha} ha</span>
          </div>
        </div>

        {/* Lote metrics */}
        {tank.phase !== 'vazio' && (
          <div className="space-y-2">
            {hasLote ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1">
                    <Fish className="h-3 w-3 text-primary/70" />
                    <span className="text-xs font-medium text-foreground">
                      {(lote.qtd_peixes ?? 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1">
                    <Scale className="h-3 w-3 text-primary/70" />
                    <span className="text-xs font-medium text-foreground">
                      {(lote.peso_total_kg ?? 0).toLocaleString('pt-BR')} kg
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  Lote Ativo
                </span>
              </>
            ) : (
              <span className="inline-flex items-center rounded-full border border-muted bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Sem lote
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
