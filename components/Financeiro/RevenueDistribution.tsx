'use client';

import { useStore } from '@/lib/store';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PHASE_COLORS: string[] = ['#3b82f6', '#22c55e', '#f59e0b', '#64748b'];

const PHASE_LABELS: Record<string, string> = {
  bercario: 'Berçário',
  recria: 'Recria',
  engorda: 'Engorda',
  vazio: 'Vazio',
};

export default function RevenueDistribution() {
  const { tanks, bercarioLotes, recriaLotes, engordaLotes, premissas } = useStore();

  const biomassByPhase = [
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

  const totalBiomass = biomassByPhase.reduce((s, p) => s + p.biomass, 0);
  const receitaEstimada = totalBiomass * premissas.preco_venda * premissas.ciclos_ano;

  const pieData = biomassByPhase.map((p, i) => ({
    name: p.label,
    value: p.biomass,
    color: PHASE_COLORS[i],
    fish: p.fish,
  }));

  return (
    <div className="h-full flex flex-col rounded-2xl border border-border bg-card/90 p-5 shadow-sm shadow-blue-950/5 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
            Distribuição de Biomassa
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Receita estimada: R$ {receitaEstimada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/ano
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
              formatter={(value: unknown) => {
                const num = typeof value === 'number' ? value : 0;
                return [`${num.toLocaleString('pt-BR')} kg`, 'Biomassa'];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary footer */}
      <div className="mt-2 space-y-1.5">
        {biomassByPhase.map((phase, i) => {
          const percent = totalBiomass > 0 ? ((phase.biomass / totalBiomass) * 100).toFixed(1) : '0';
          return (
            <div key={phase.phase} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[i] }} />
                <span className="text-slate-600">{phase.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{phase.fish.toLocaleString('pt-BR')} peixes</span>
                <span className="font-semibold text-slate-700 w-20 text-right">
                  {phase.biomass.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
                </span>
                <span className="text-slate-400 w-10 text-right">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
