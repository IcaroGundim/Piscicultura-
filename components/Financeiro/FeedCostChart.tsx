'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calculator } from 'lucide-react';

import { PHASE_COLORS, PHASE_LABELS } from '@/lib/types';
import type { TankPhase } from '@/lib/types';
import EmptyState from '@/components/EmptyState';

interface TooltipPayloadItem {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl bg-slate-900/90 text-white p-3 shadow-xl text-xs space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((item, idx) => (
        <p key={idx} className="text-slate-200">
          {item.name === 'Mensal' ? 'Mensal' : 'Total do Ciclo'}: <span className="font-bold text-white">{Number(item.value).toFixed(1)} sacos</span>
        </p>
      ))}
    </div>
  );
}

export default function FeedCostChart() {
  const bercarioLotes = useStore((s) => s.bercarioLotes);
  const recriaLotes = useStore((s) => s.recriaLotes);
  const engordaLotes = useStore((s) => s.engordaLotes);

  const { feedByPhase, totalRacaoMes } = useMemo(() => {
    const data = [
      {
        phase: 'bercario',
        label: PHASE_LABELS.bercario,
        racao_mes: bercarioLotes.reduce((s, l) => s + l.racao_mes_sc, 0),
        racao_total: bercarioLotes.reduce((s, l) => s + l.racao_total_sc, 0),
        qtd_lotes: bercarioLotes.length,
      },
      {
        phase: 'recria',
        label: PHASE_LABELS.recria,
        racao_mes: recriaLotes.reduce((s, l) => s + l.racao_mes_sc, 0),
        racao_total: recriaLotes.reduce((s, l) => s + l.racao_total_sc, 0),
        qtd_lotes: recriaLotes.length,
      },
      {
        phase: 'engorda',
        label: PHASE_LABELS.engorda,
        racao_mes: engordaLotes.reduce((s, l) => s + l.racao_mes_sc, 0),
        racao_total: engordaLotes.reduce((s, l) => s + l.racao_total_sc, 0),
        qtd_lotes: engordaLotes.length,
      },
    ];
    const total = data.reduce((s, p) => s + p.racao_mes, 0);
    return { feedByPhase: data, totalRacaoMes: total };
  }, [bercarioLotes, recriaLotes, engordaLotes]);

  if (feedByPhase.every((p) => p.racao_mes === 0)) {
    return (
      <div className="h-full flex flex-col rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Consumo de Ração por Fase</h3>
          </div>
        </div>
        <EmptyState icon={Calculator} title="Nenhum dado de ração" description="Adicione lotes para visualizar o consumo de ração por fase." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Consumo de Ração por Fase
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total: {totalRacaoMes.toFixed(1)} sacos/mês
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={feedByPhase} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v) => `${v} sc`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="racao_mes" name="Mensal" radius={[8, 8, 0, 0]} maxBarSize={60} animationBegin={200} animationDuration={800}>
              {feedByPhase.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.phase as TankPhase]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary footer */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {feedByPhase.map((phase) => (
          <div
            key={phase.phase}
            className="rounded-xl border p-3 text-center"
            style={{
              backgroundColor: `${PHASE_COLORS[phase.phase as TankPhase]}14`,
              borderColor: `${PHASE_COLORS[phase.phase as TankPhase]}20`,
            }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase.phase as TankPhase] }} />
              <span className="text-xs text-muted-foreground uppercase">{phase.label}</span>
            </div>
            <p className="text-xs font-semibold text-foreground">{phase.racao_mes.toFixed(1)} sc/mês</p>
            <p className="text-xs text-muted-foreground">{phase.qtd_lotes} lote(s)</p>
          </div>
        ))}
      </div>
    </div>
  );
}
