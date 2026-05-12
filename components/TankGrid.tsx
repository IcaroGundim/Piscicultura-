'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import TankCard from './TankCard';
import TankDetailPanel from './TankDetailPanel';
import { cn } from '@/lib/utils';
import { Fish } from 'lucide-react';

const filterOptions: Array<{ value: TankPhase | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'bercario', label: PHASE_LABELS.bercario },
  { value: 'recria', label: PHASE_LABELS.recria },
  { value: 'engorda', label: PHASE_LABELS.engorda },
  { value: 'vazio', label: PHASE_LABELS.vazio },
];

export default function TankGrid() {
  const tanks = useStore((s) => s.activeTanks);
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);
  const [selectedTankId, setSelectedTankId] = useState<number | null>(null);
  const [filter, setFilter] = useState<TankPhase | 'all'>('all');

  const filteredTanks = filter === 'all' ? tanks : tanks.filter((t) => t.phase === filter);
  const selectedTank = tanks.find((t) => t.id === selectedTankId) ?? null;

  return (
    <div className="flex h-full min-h-[500px] flex-col gap-6 lg:flex-row">
      {/* Left Sidebar: List of Tanks (Max ~30% width) */}
      <div role="region" aria-label="Lista de tanques" className="flex h-full w-full shrink-0 flex-col gap-4 lg:w-72 xl:w-80">
        {/* Filter tabs */}
        <div role="tablist" className="flex items-center gap-1.5 flex-wrap">
          {filterOptions.map(({ value, label }) => {
            const count = value === 'all' ? tanks.length : tanks.filter((t) => t.phase === value).length;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 min-h-[44px]',
                  filter === value
                    ? 'border-primary/20 bg-primary/10 text-primary shadow-sm'
                    : 'border-border/90 bg-card/90 text-muted-foreground hover:border-primary/20 hover:text-primary hover:shadow-sm'
                )}
              >
                {label}
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-xs font-bold',
                    filter === value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tank List */}
        <div className="flex-1 pr-2 space-y-2 pb-4">
          {filteredTanks.map((tank, idx) => (
            <TankCard
              key={tank.id}
              tank={tank}
              isSelected={selectedTankId === tank.id}
              onClick={() => setSelectedTankId(selectedTankId === tank.id ? null : tank.id)}
              animationDelay={idx * 30}
            />
          ))}
        </div>
      </div>

      {/* Right Area: Expanded Details (Flex 1) */}
      <div role="complementary" aria-label="Detalhes do tanque" className="relative flex h-[70dvh] min-w-0 flex-1 flex-col self-start overflow-hidden rounded-3xl border border-border/90 bg-card/80 shadow-xl shadow-blue-950/5 backdrop-blur-sm lg:h-[78dvh]">
        {selectedTank ? (
          <TankDetailPanel
            tank={selectedTank}
            bercarioLote={bercarioLotes.find((l) => l.tankId === selectedTank.id)}
            recriaLote={recriaLotes.find((l) => l.tankId === selectedTank.id)}
            engordaLote={engordaLotes.find((l) => l.tankId === selectedTank.id)}
            onClose={() => setSelectedTankId(null)}
          />
        ) : (
          <div role="status" aria-live="polite" className="flex flex-1 animate-in flex-col items-center justify-center p-8 text-center text-muted-foreground fade-in duration-500">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
              <Fish className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum tanque selecionado</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Selecione um tanque na lista ao lado para visualizar os detalhes de produção, lotes e alimentação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
