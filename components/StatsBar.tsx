'use client';

import { useStore } from '@/lib/store';
import { Fish, Layers, TrendingUp, Wheat } from 'lucide-react';

export default function StatsBar() {
  const { tanks, bercarioLotes, recriaLotes, engordaLotes, premissas } = useStore();

  const countByPhase = (phase: string) => tanks.filter((t) => t.phase === phase).length;

  const totalFishBercario = bercarioLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const totalFishRecria = recriaLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const totalFishEngorda = engordaLotes.reduce((s, l) => s + l.qtd_peixes, 0);
  const totalFish = totalFishBercario + totalFishRecria + totalFishEngorda;

  const totalPesoEngorda = engordaLotes.reduce((s, l) => s + l.peso_total_kg, 0);
  const receitaEstimada = totalPesoEngorda * premissas.preco_venda * premissas.ciclos_ano;

  const totalRacaoMes = [
    ...bercarioLotes.map((l) => l.racao_mes_sc),
    ...recriaLotes.map((l) => l.racao_mes_sc),
    ...engordaLotes.map((l) => l.racao_mes_sc),
  ].reduce((s, v) => s + v, 0);

  const stats = [
    {
      icon: Fish,
      label: 'Total de Peixes',
      value: totalFish.toLocaleString('pt-BR'),
      sub: `${countByPhase('bercario')}B · ${countByPhase('recria')}R · ${countByPhase('engorda')}E`,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200/80',
    },
    {
      icon: Layers,
      label: 'Tanques Ativos',
      value: (countByPhase('bercario') + countByPhase('recria') + countByPhase('engorda')).toString(),
      sub: `de ${tanks.length} tanques`,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200/80',
    },
    {
      icon: TrendingUp,
      label: 'Receita Estimada/Ano',
      value: `R$ ${(receitaEstimada).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      sub: `${premissas.ciclos_ano} ciclos · R$ ${premissas.preco_venda}/kg`,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200/80',
    },
    {
      icon: Wheat,
      label: 'Ração/Mês',
      value: `${totalRacaoMes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} sc`,
      sub: 'todos os tanques',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200/80',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, sub, color, bg, border }) => (
        <div
          key={label}
          className={`group flex items-center gap-3 rounded-2xl border ${bg} ${border} bg-card/90 px-4 py-3 shadow-sm shadow-blue-900/5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${bg} ${border}`}>
            <Icon className={`w-4.5 h-4.5 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider leading-tight text-slate-500">{label}</p>
            <p className={`text-sm font-bold leading-tight ${color}`} style={{ fontFamily: 'var(--font-syne)' }}>
              {value}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-400">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
