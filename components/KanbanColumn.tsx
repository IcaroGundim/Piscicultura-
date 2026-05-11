'use client';

import type { Tank, TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import TankCard from './TankCard';
import { Inbox } from 'lucide-react';

interface KanbanColumnProps {
  phase: TankPhase;
  tanks: Tank[];
  selectedTankId: number | null;
  onSelectTank: (id: number | null) => void;
}

const phaseHeaderBgMap: Record<TankPhase, string> = {
  bercario: 'bg-blue-500/5',
  recria: 'bg-emerald-500/5',
  engorda: 'bg-amber-500/5',
  vazio: 'bg-slate-500/5',
};

const phaseBorderTopMap: Record<TankPhase, string> = {
  bercario: 'border-t-blue-500',
  recria: 'border-t-emerald-500',
  engorda: 'border-t-amber-500',
  vazio: 'border-t-slate-400',
};

const phaseCounterBgMap: Record<TankPhase, string> = {
  bercario: 'bg-blue-500',
  recria: 'bg-emerald-500',
  engorda: 'bg-amber-500',
  vazio: 'bg-slate-400',
};

export default function KanbanColumn({
  phase,
  tanks,
  selectedTankId,
  onSelectTank,
}: KanbanColumnProps) {
  const isEmpty = tanks.length === 0;

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
            'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white',
            phaseCounterBgMap[phase]
          )}
        >
          {tanks.length}
        </span>
      </div>

      {/* Scrollable Card Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 custom-scrollbar">
        {tanks.map((tank, idx) => (
          <TankCard
            key={tank.id}
            tank={tank}
            isSelected={selectedTankId === tank.id}
            onClick={() =>
              onSelectTank(selectedTankId === tank.id ? null : tank.id)
            }
            animationDelay={idx * 30}
          />
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
