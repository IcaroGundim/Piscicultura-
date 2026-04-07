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
  const { tanks, bercarioLotes, recriaLotes, engordaLotes } = useStore();
  const [selectedTankId, setSelectedTankId] = useState<number | null>(null);
  const [filter, setFilter] = useState<TankPhase | 'all'>('all');

  const filteredTanks = filter === 'all' ? tanks : tanks.filter((t) => t.phase === filter);
  const selectedTank = tanks.find((t) => t.id === selectedTankId) ?? null;

  return (
    <div className="flex h-full min-h-[500px] flex-col gap-6 lg:flex-row">
      {/* Left Sidebar: List of Tanks (Max ~30% width) */}
      <div className="flex h-full w-full shrink-0 flex-col gap-4 lg:w-72 xl:w-80">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterOptions.map(({ value, label }) => {
            const count = value === 'all' ? tanks.length : tanks.filter((t) => t.phase === value).length;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                  filter === value
                    ? 'border-blue-200 bg-blue-50/90 text-blue-700 shadow-sm shadow-blue-100/70'
                    : 'border-border/90 bg-card/90 text-slate-500 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm'
                )}
              >
                {label}
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[9px] font-bold',
                    filter === value ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tank List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-4">
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
      <div className="relative flex h-[70vh] min-w-0 flex-1 flex-col self-start overflow-hidden rounded-3xl border border-border/90 bg-card/80 shadow-xl shadow-blue-950/5 backdrop-blur-sm lg:h-[78vh]">
        {selectedTank ? (
          <TankDetailPanel
            tank={selectedTank}
            bercarioLote={bercarioLotes.find((l) => l.tankId === selectedTank.id)}
            recriaLote={recriaLotes.find((l) => l.tankId === selectedTank.id)}
            engordaLote={engordaLotes.find((l) => l.tankId === selectedTank.id)}
            onClose={() => setSelectedTankId(null)}
          />
        ) : (
          <div className="flex flex-1 animate-in flex-col items-center justify-center p-8 text-center text-slate-400 fade-in duration-500">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
              <Fish className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum tanque selecionado</h3>
            <p className="text-sm text-slate-500 max-w-[280px]">
              Selecione um tanque na lista ao lado para visualizar os detalhes de produção, lotes e alimentação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
