'use client';

import { useRef, useLayoutEffect } from 'react';
import type { Tank, TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import TankDetailPopover from './TankDetailPopover';
import { Inbox } from 'lucide-react';

interface KanbanColumnProps {
  phase: TankPhase;
  tanks: Tank[];
  selectedTankId: number | null;
  onSelectTank: (id: number | null) => void;
}

const phaseHeaderBgMap: Record<TankPhase, string> = {
  bercario: 'bg-(--phase-bercario)/10',
  recria: 'bg-(--phase-recria)/6',
  engorda: 'bg-(--phase-engorda)/8',
  vazio: 'bg-zinc-500/5',
};

const phaseBorderTopMap: Record<TankPhase, string> = {
  bercario: 'border-t-(--phase-bercario)',
  recria: 'border-t-(--phase-recria)',
  engorda: 'border-t-(--phase-engorda)',
  vazio: 'border-t-zinc-500',
};

/** Contador da coluna: fundo da fase + texto com contraste */
const phaseCounterClassMap: Record<TankPhase, string> = {
  bercario: 'bg-(--phase-bercario) text-white',
  recria: 'bg-(--phase-recria) text-white',
  engorda: 'bg-(--phase-engorda) text-white',
  vazio: 'bg-zinc-500 text-white',
};

export default function KanbanColumn({
  phase,
  tanks,
  selectedTankId,
  onSelectTank,
}: KanbanColumnProps) {
  const isEmpty = tanks.length === 0;
  const cardsRef = useRef<HTMLDivElement>(null);
  const prevTanksRef = useRef<string>('');

  useLayoutEffect(() => {
    let cancelled = false;
    const tankIds = tanks.map((t) => t.id).join(',');
    const prevTankIds = prevTanksRef.current.split(',').filter(Boolean);
    const currentIds = tankIds.split(',').filter(Boolean);

    // Only animate on initial mount or when tanks actually change
    if (prevTanksRef.current === tankIds) return undefined;

    const newTankIds = currentIds.filter((id) => !prevTankIds.includes(id));

    if (!cardsRef.current) {
      prevTanksRef.current = tankIds;
      return undefined;
    }

    // Animate only new tanks
    if (newTankIds.length > 0) {
      const newCards = cardsRef.current.querySelectorAll(
        `.tank-card-animate[data-tank-id="${newTankIds.join('"], .tank-card-animate[data-tank-id="')}"]`
      );

      if (newCards.length > 0) {
        void import('gsap').then(({ default: gsap }) => {
          if (cancelled) return;

          gsap.fromTo(
            newCards,
            { opacity: 0, y: 20, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.4,
              ease: 'power2.out',
              stagger: { each: 0.08, from: 'start' },
            }
          );
        });
      }
    }

    prevTanksRef.current = tankIds;

    return () => {
      cancelled = true;
    };
  }, [tanks]);

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden',
        'border-t-2',
        phaseBorderTopMap[phase],
        isEmpty && phase === 'vazio' && 'opacity-70'
      )}
      role="region"
      aria-label={`Coluna ${PHASE_LABELS[phase]}`}
    >
      {/* Fixed Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 shrink-0',
          phaseHeaderBgMap[phase]
        )}
      >
        <span className="text-sm font-bold text-foreground">
          {PHASE_LABELS[phase]}
        </span>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold',
            phaseCounterClassMap[phase]
          )}
        >
          {tanks.length}
        </span>
      </div>

      {/* Scrollable Card Area */}
      <div ref={cardsRef} className="flex-1 overflow-y-auto px-3 pt-3 pb-4 space-y-3 custom-scrollbar">
        {tanks.map((tank, idx) => (
          <div key={tank.id} className="tank-card-animate" data-tank-id={tank.id}>
            <TankDetailPopover
              tank={tank}
              open={selectedTankId === tank.id}
              onOpenChange={(o) => onSelectTank(o ? tank.id : null)}
              animationDelay={idx * 30}
            />
          </div>
        ))}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
              <Inbox className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">Nenhum tanque</p>
          </div>
        )}
      </div>
    </div>
  );
}
