'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import KanbanColumn from './KanbanColumn';
import TankDetailModal from './TankDetailModal';
import { Fish, Sprout, Scale, CircleOff } from 'lucide-react';

const phases: TankPhase[] = ['bercario', 'recria', 'engorda', 'vazio'];
const phaseIcons: Record<TankPhase, typeof Fish> = {
  bercario: Fish,
  recria: Sprout,
  engorda: Scale,
  vazio: CircleOff,
};

export default function KanbanBoard() {
  const tanks = useStore((s) => s.tanks);
  const [selectedTankId, setSelectedTankId] = useState<number | null>(null);
  const [mobilePhase, setMobilePhase] = useState<TankPhase>('bercario');

  const tanksByPhase = useMemo(() => {
    const map: Record<TankPhase, typeof tanks> = {
      bercario: [],
      recria: [],
      engorda: [],
      vazio: [],
    };
    for (const tank of tanks) {
      map[tank.phase].push(tank);
    }
    return map;
  }, [tanks]);

  const selectedTank = useMemo(
    () => tanks.find((t) => t.id === selectedTankId) ?? null,
    [tanks, selectedTankId]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Tabs */}
      <div className="md:hidden mb-3 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {phases.map((phase) => {
            const Icon = phaseIcons[phase];
            const isActive = mobilePhase === phase;
            return (
              <button
                key={phase}
                onClick={() => setMobilePhase(phase)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'border-primary/20 bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                aria-pressed={isActive}
              >
                <Icon className="h-3.5 w-3.5" />
                {PHASE_LABELS[phase]}
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tanksByPhase[phase].length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0">
        {/* Desktop/Tablet: all columns */}
        <div className="hidden md:grid md:grid-cols-2 lg:flex lg:flex-row h-full gap-4 overflow-x-auto pb-2">
          {phases.map((phase) => (
            <div key={phase} className="h-full lg:min-w-[260px] lg:flex-1">
              <KanbanColumn
                phase={phase}
                tanks={tanksByPhase[phase]}
                selectedTankId={selectedTankId}
                onSelectTank={setSelectedTankId}
              />
            </div>
          ))}
        </div>

        {/* Mobile: single column */}
        <div className="md:hidden h-full">
          <KanbanColumn
            phase={mobilePhase}
            tanks={tanksByPhase[mobilePhase]}
            selectedTankId={selectedTankId}
            onSelectTank={setSelectedTankId}
          />
        </div>
      </div>

      {/* Modal */}
      <TankDetailModal
        tank={selectedTank}
        onClose={() => setSelectedTankId(null)}
      />
    </div>
  );
}
