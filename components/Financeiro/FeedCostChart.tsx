'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calculator, Package } from 'lucide-react';

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
          Mensal: <span className="font-bold text-white">{Number(item.value).toFixed(1)} sacos</span>
        </p>
      ))}
    </div>
  );
}

export default function FeedCostChart() {
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);
  const phaseColors = useStore((s) => s.phaseColors);

  const colorFor = (phase: TankPhase) => phaseColors[phase] ?? PHASE_COLORS[phase];

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
      <div className="relative isolate h-full flex flex-col overflow-hidden rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
        {/* Marca d'água do header */}
        <Package
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-4 -z-10 h-28 w-28 -rotate-12 text-brand/[0.06]"
        />
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
    <div className="relative isolate h-full flex flex-col overflow-hidden rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:p-5">
      {/* Marca d'água do header */}
      <Package
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 -z-10 h-28 w-28 -rotate-12 text-brand/[0.06]"
      />
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

      <div className="flex-1 w-full min-h-[220px] sm:min-h-[240px]">
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
                <Cell key={`cell-${index}`} fill={colorFor(entry.phase as TankPhase)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary footer */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {feedByPhase.map((phase) => {
          const color = colorFor(phase.phase as TankPhase);
          const share = totalRacaoMes > 0 ? (phase.racao_mes / totalRacaoMes) * 100 : 0;
          return (
            <div
              key={phase.phase}
              className="group relative overflow-hidden rounded-xl border p-3 pl-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:pl-3"
              style={{
                background: `linear-gradient(135deg, ${color}1A 0%, ${color}08 100%)`,
                borderColor: `${color}33`,
              }}
            >
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-1"
                style={{ backgroundColor: color }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
                style={{ backgroundColor: color }}
              />

              <div className="relative flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {phase.label}
                </span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums"
                  style={{ backgroundColor: `${color}1F`, color }}
                >
                  {share.toFixed(0)}%
                </span>
              </div>

              <div className="relative mt-2 flex min-w-0 items-baseline gap-1">
                <span className="text-xl font-bold tabular-nums text-foreground leading-none sm:text-lg">
                  {phase.racao_mes.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">sc/mês</span>
              </div>

              <div className="relative mt-1.5 flex min-w-0 items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span>{phase.qtd_lotes} lote{phase.qtd_lotes === 1 ? '' : 's'}</span>
                <span className="tabular-nums whitespace-nowrap">{phase.racao_total.toFixed(0)} sc total</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
