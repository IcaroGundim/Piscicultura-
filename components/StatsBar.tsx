'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Fish, Layers, TrendingUp, Wheat } from 'lucide-react';

type StatKey = 'fish' | 'tanks' | 'revenue' | 'feed';

interface StatItem {
  key: StatKey;
  icon: typeof Fish;
  label: string;
  value: string;
  sub: string;
}

export default function StatsBar() {
  const tanks = useStore((s) => s.tanks);
  const bercarioLotes = useStore((s) => s.bercarioLotes);
  const recriaLotes = useStore((s) => s.recriaLotes);
  const engordaLotes = useStore((s) => s.engordaLotes);
  const premissas = useStore((s) => s.premissas);

  const countByPhase = useMemo(
    () => (phase: 'bercario' | 'recria' | 'engorda' | 'vazio') =>
      tanks.filter((t) => t.phase === phase).length,
    [tanks]
  );

  const totalFishBercario = useMemo(
    () => bercarioLotes.reduce((s, l) => s + l.qtd_peixes, 0),
    [bercarioLotes]
  );
  const totalFishRecria = useMemo(
    () => recriaLotes.reduce((s, l) => s + l.qtd_peixes, 0),
    [recriaLotes]
  );
  const totalFishEngorda = useMemo(
    () => engordaLotes.reduce((s, l) => s + l.qtd_peixes, 0),
    [engordaLotes]
  );
  const totalFish = totalFishBercario + totalFishRecria + totalFishEngorda;

  const totalPesoEngorda = useMemo(
    () => engordaLotes.reduce((s, l) => s + l.peso_total_kg, 0),
    [engordaLotes]
  );
  const receitaEstimada = totalPesoEngorda * premissas.preco_venda * premissas.ciclos_ano;

  const totalRacaoMes = useMemo(
    () =>
      [...bercarioLotes, ...recriaLotes, ...engordaLotes].reduce(
        (s, l) => s + l.racao_mes_sc,
        0
      ),
    [bercarioLotes, recriaLotes, engordaLotes]
  );

  const stats: StatItem[] = [
    {
      key: 'fish',
      icon: Fish,
      label: 'Total de Peixes',
      value: totalFish.toLocaleString('pt-BR'),
      sub: `${countByPhase('bercario')}B · ${countByPhase('recria')}R · ${countByPhase('engorda')}E`,
    },
    {
      key: 'tanks',
      icon: Layers,
      label: 'Tanques Ativos',
      value: (countByPhase('bercario') + countByPhase('recria') + countByPhase('engorda')).toString(),
      sub: `de ${tanks.length} tanques`,
    },
    {
      key: 'revenue',
      icon: TrendingUp,
      label: 'Receita Estimada/Ano',
      value: `R$ ${receitaEstimada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      sub: `${premissas.ciclos_ano} ciclos · R$ ${premissas.preco_venda}/kg`,
    },
    {
      key: 'feed',
      icon: Wheat,
      label: 'Ração/Mês',
      value: `${totalRacaoMes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} sc`,
      sub: 'todos os tanques',
    },
  ];

  const statMeta: Record<StatKey, { border: string; iconBg: string; iconColor: string; barColor: string; barWidth: string }> = {
    fish:    { border: 'border-l-blue-500',    iconBg: 'bg-blue-500/10',    iconColor: 'text-blue-600',    barColor: 'bg-blue-500',    barWidth: 'w-[75%]' },
    tanks:   { border: 'border-l-indigo-500',  iconBg: 'bg-indigo-500/10',  iconColor: 'text-indigo-600',  barColor: 'bg-indigo-500',  barWidth: 'w-[60%]' },
    revenue: { border: 'border-l-emerald-500', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600', barColor: 'bg-emerald-500', barWidth: 'w-[80%]' },
    feed:    { border: 'border-l-orange-500',  iconBg: 'bg-orange-500/10',  iconColor: 'text-orange-600',  barColor: 'bg-orange-500',  barWidth: 'w-[65%]' },
  };

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ key, icon: Icon, label, value, sub }) => {
        const meta = statMeta[key];

        return (
          <div
            key={label}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
              'border-l-2',
              meta.border
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', meta.iconBg)}>
                <Icon className={cn('w-5 h-5', meta.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-lg font-bold text-foreground font-heading leading-tight">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
              </div>
            </div>
            </div>
        );
      })}
    </div>
  );
}
