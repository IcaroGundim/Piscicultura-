'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PHASE_LABELS, PHASE_COLORS } from '@/lib/types';
import type { TankPhase } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Fish, Scale, Package } from 'lucide-react';

type PhaseFilter = 'todos' | TankPhase;
type Metric = 'peixes' | 'biomassa' | 'racao';

const FILTER_OPTIONS: { value: PhaseFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'bercario', label: 'Berçário' },
  { value: 'recria', label: 'Recria' },
  { value: 'engorda', label: 'Engorda' },
];

const METRIC_OPTIONS: { value: Metric; label: string; icon: typeof Fish; unit: string; unitShort: string }[] = [
  { value: 'peixes', label: 'Peixes', icon: Fish, unit: 'peixes', unitShort: '' },
  { value: 'biomassa', label: 'Biomassa', icon: Scale, unit: 'kg', unitShort: 'kg' },
  { value: 'racao', label: 'Ração/mês', icon: Package, unit: 'sc/mês', unitShort: 'sc' },
];

export default function FishCountChart() {
  const { tanks, bercarioLotes, recriaLotes, engordaLotes } = useStore();
  const [filter, setFilter] = useState<PhaseFilter>('todos');
  const [metric, setMetric] = useState<Metric>('peixes');

  const metricConfig = METRIC_OPTIONS.find((m) => m.value === metric)!;

  const chartData = useMemo(() => {
    // Build maps for each metric per tank
    const fishMap = new Map<number, number>();
    const biomassMap = new Map<number, number>();
    const racaoMap = new Map<number, number>();

    bercarioLotes.forEach((l) => {
      fishMap.set(l.tankId, (fishMap.get(l.tankId) ?? 0) + l.qtd_peixes);
      biomassMap.set(l.tankId, (biomassMap.get(l.tankId) ?? 0) + l.peso_total_kg);
      racaoMap.set(l.tankId, (racaoMap.get(l.tankId) ?? 0) + l.racao_mes_sc);
    });
    recriaLotes.forEach((l) => {
      fishMap.set(l.tankId, (fishMap.get(l.tankId) ?? 0) + l.qtd_peixes);
      biomassMap.set(l.tankId, (biomassMap.get(l.tankId) ?? 0) + l.peso_total_kg);
      racaoMap.set(l.tankId, (racaoMap.get(l.tankId) ?? 0) + l.racao_mes_sc);
    });
    engordaLotes.forEach((l) => {
      fishMap.set(l.tankId, (fishMap.get(l.tankId) ?? 0) + l.qtd_peixes);
      biomassMap.set(l.tankId, (biomassMap.get(l.tankId) ?? 0) + l.peso_total_kg);
      racaoMap.set(l.tankId, (racaoMap.get(l.tankId) ?? 0) + l.racao_mes_sc);
    });

    const getMetricValue = (tankId: number): number => {
      if (metric === 'peixes') return fishMap.get(tankId) ?? 0;
      if (metric === 'biomassa') return biomassMap.get(tankId) ?? 0;
      return racaoMap.get(tankId) ?? 0;
    };

    return tanks
      .filter((t) => {
        if (filter === 'todos') return t.phase !== 'vazio';
        return t.phase === filter;
      })
      .map((t) => ({
        name: `T${t.id.toString().padStart(2, '0')}`,
        valor: getMetricValue(t.id),
        phase: t.phase,
        color: PHASE_COLORS[t.phase] ?? '#94a3b8',
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [tanks, bercarioLotes, recriaLotes, engordaLotes, filter, metric]);

  const total = chartData.reduce((s, d) => s + d.valor, 0);
  const activeTanks = chartData.length;

  const formatValue = (v: number) => {
    if (metric === 'peixes') return v.toLocaleString('pt-BR');
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  const subtitleText = (() => {
    if (metric === 'peixes') return `${formatValue(total)} peixes em ${activeTanks} tanques`;
    if (metric === 'biomassa') return `${formatValue(total)} kg em ${activeTanks} tanques`;
    return `${formatValue(total)} sc/mês em ${activeTanks} tanques`;
  })();

  return (
    <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm shadow-blue-950/5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
              <metricConfig.icon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
                Dados por Tanque
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitleText}
              </p>
            </div>
          </div>

          {/* Phase Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-0.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
                  ${filter === opt.value
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-700 border border-transparent'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1.5">
          {METRIC_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = metric === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMetric(opt.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                  }
                `}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="w-full" style={{ height: Math.max(280, chartData.length * 38 + 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) =>
                  metric === 'peixes'
                    ? v.toLocaleString('pt-BR')
                    : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  padding: '8px 12px',
                }}
                formatter={(value) => {
                  const num = Number(value ?? 0);
                  return [`${formatValue(num)} ${metricConfig.unit}`, metricConfig.label];
                }}
                labelFormatter={(label) => `Tanque ${label}`}
                cursor={{ fill: 'rgba(59,130,246,0.04)' }}
              />
              <Bar dataKey="valor" radius={[0, 6, 6, 0]} maxBarSize={28} animationDuration={600}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="valor"
                  position="right"
                  style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => {
                    const num = Number(v ?? 0);
                    if (metric === 'peixes') return num.toLocaleString('pt-BR');
                    return num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Fish className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">Nenhum tanque com dados nesta fase</p>
        </div>
      )}

      {/* Legend */}
      {filter === 'todos' && chartData.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {(['bercario', 'recria', 'engorda'] as const).map((phase) => {
            const phaseTotal = chartData.filter((d) => d.phase === phase).reduce((s, d) => s + d.valor, 0);
            if (phaseTotal === 0) return null;
            return (
              <div key={phase} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                <span className="text-[11px] text-slate-600 font-medium">
                  {PHASE_LABELS[phase]}: {formatValue(phaseTotal)} {metricConfig.unitShort}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
