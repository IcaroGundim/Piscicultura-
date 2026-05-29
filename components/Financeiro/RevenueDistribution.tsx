'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale } from 'lucide-react';

import { PHASE_COLORS, PHASE_LABELS } from '@/lib/types';
import type { TankPhase } from '@/lib/types';
import EmptyState from '@/components/EmptyState';

interface TooltipPayloadItem {
  value: number;
  name: string;
  payload: {
    fish: number;
    color: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl bg-slate-900/90 text-white p-3 shadow-xl text-xs space-y-1">
      <p className="font-semibold">{item.name}</p>
      <p className="text-slate-200">
        Biomassa: <span className="font-bold text-white">{Number(item.value).toLocaleString('pt-BR')} kg</span>
      </p>
      <p className="text-slate-200">
        Peixes: <span className="font-bold text-white">{item.payload.fish.toLocaleString('pt-BR')}</span>
      </p>
    </div>
  );
}

export default function RevenueDistribution() {
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);
  const phaseColors = useStore((s) => s.phaseColors);

  const { biomassByPhase, totalBiomass, pieData } = useMemo(() => {
    const phases = [
      {
        phase: 'bercario',
        label: PHASE_LABELS.bercario,
        biomass: bercarioLotes.reduce((s, l) => s + l.peso_total_kg, 0),
        fish: bercarioLotes.reduce((s, l) => s + l.qtd_peixes, 0),
      },
      {
        phase: 'recria',
        label: PHASE_LABELS.recria,
        biomass: recriaLotes.reduce((s, l) => s + l.peso_total_kg, 0),
        fish: recriaLotes.reduce((s, l) => s + l.qtd_peixes, 0),
      },
      {
        phase: 'engorda',
        label: PHASE_LABELS.engorda,
        biomass: engordaLotes.reduce((s, l) => s + l.peso_total_kg, 0),
        fish: engordaLotes.reduce((s, l) => s + l.qtd_peixes, 0),
      },
    ].filter((p) => p.biomass > 0);

    const total = phases.reduce((s, p) => s + p.biomass, 0);
    const pie = phases.map((p) => ({
      name: p.label,
      value: p.biomass,
      color: phaseColors[p.phase as TankPhase] ?? PHASE_COLORS[p.phase as TankPhase],
      fish: p.fish,
    }));

    return { biomassByPhase: phases, totalBiomass: total, pieData: pie };
  }, [bercarioLotes, recriaLotes, engordaLotes, phaseColors]);

  if (biomassByPhase.length === 0) {
    return (
      <div className="h-full flex flex-col rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Distribuição de Biomassa</h3>
          </div>
        </div>
        <EmptyState icon={Scale} title="Nenhuma biomassa cadastrada" description="Adicione lotes para visualizar a distribuição de biomassa." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Distribuição de Biomassa
          </h3>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={135}
              paddingAngle={3}
              cornerRadius={6}
              dataKey="value"
              stroke="white"
              strokeWidth={2}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend / Summary footer */}
      <div className="mt-4 space-y-2">
        {biomassByPhase.map((phase) => {
          const percent = totalBiomass > 0 ? ((phase.biomass / totalBiomass) * 100).toFixed(1) : '0';
          return (
            <div key={phase.phase} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: phaseColors[phase.phase as TankPhase] ?? PHASE_COLORS[phase.phase as TankPhase] }} />
                <span className="text-foreground font-medium">{phase.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{phase.fish.toLocaleString('pt-BR')} peixes</span>
                <span className="font-semibold text-foreground w-20 text-right tabular-nums">
                  {phase.biomass.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
                </span>
                <span className="text-muted-foreground w-10 text-right tabular-nums">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
