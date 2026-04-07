'use client';

import { useStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PHASE_COLORS: Record<string, string> = {
  bercario: '#3b82f6',
  recria: '#22c55e',
  engorda: '#f59e0b',
};

const PHASE_LABELS: Record<string, string> = {
  bercario: 'Berçário',
  recria: 'Recria',
  engorda: 'Engorda',
};

export default function FeedCostChart() {
  const { bercarioLotes, recriaLotes, engordaLotes } = useStore();

  const feedByPhase = [
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

  const totalRacaoMes = feedByPhase.reduce((s, p) => s + p.racao_mes, 0);

  return (
    <div className="h-full flex flex-col rounded-2xl border border-border bg-card/90 p-5 shadow-sm shadow-blue-950/5 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
            Consumo de Ração por Fase
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total: {totalRacaoMes.toFixed(1)} sacos/mês
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={feedByPhase} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `${v} sc`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
              formatter={(value, name) => {
                const numericValue = Array.isArray(value)
                  ? Number(value[0] ?? 0)
                  : Number(value ?? 0);

                return [
                  `${numericValue.toFixed(1)} sacos`,
                  String(name) === 'racao_mes' ? 'Mensal' : 'Total do Ciclo',
                ];
              }}
            />
            <Bar dataKey="racao_mes" name="Mensal" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {feedByPhase.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.phase]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary footer */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {feedByPhase.map((phase) => (
          <div key={phase.phase} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase.phase] }} />
              <span className="text-[10px] text-slate-500 uppercase">{phase.label}</span>
            </div>
            <p className="text-xs font-semibold text-slate-700">{phase.racao_mes.toFixed(1)} sc/mês</p>
            <p className="text-[10px] text-slate-400">{phase.qtd_lotes} lote(s)</p>
          </div>
        ))}
      </div>
    </div>
  );
}
