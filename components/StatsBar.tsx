'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Fish, Layers, TrendingUp, Wheat } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

type StatKey = 'fish' | 'tanks' | 'revenue' | 'feed';

interface StatItem {
  key: StatKey;
  icon: typeof Fish;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sub: string;
}

export default function StatsBar() {
  const tanks = useStore((s) => s.activeTanks);
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);
  const premissas = useStore((s) => s.activePremissas);

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

  const activeTanks = countByPhase('bercario') + countByPhase('recria') + countByPhase('engorda');

  const stats: StatItem[] = [
    {
      key: 'fish',
      icon: Fish,
      label: 'Total de Peixes',
      value: totalFish,
      sub: `${countByPhase('bercario')}B · ${countByPhase('recria')}R · ${countByPhase('engorda')}E`,
    },
    {
      key: 'tanks',
      icon: Layers,
      label: 'Tanques Ativos',
      value: activeTanks,
      sub: `de ${tanks.length} tanques`,
    },
    {
      key: 'revenue',
      icon: TrendingUp,
      label: 'Receita Estimada/Ano',
      value: receitaEstimada,
      prefix: 'R$ ',
      decimals: 0,
      sub: `${premissas.ciclos_ano} ciclos · R$ ${premissas.preco_venda}/kg`,
    },
    {
      key: 'feed',
      icon: Wheat,
      label: 'Ração/Mês',
      value: totalRacaoMes,
      suffix: ' sc',
      decimals: 1,
      sub: 'todos os tanques',
    },
  ];

  const statMeta: Record<StatKey, { border: string; bg: string; iconBg: string; iconColor: string; valueColor: string }> = {
    fish:    { border: 'border-l-blue-600',    bg: 'bg-blue-50/60',    iconBg: 'bg-blue-600',    iconColor: 'text-white',    valueColor: 'text-blue-700' },
    tanks:   { border: 'border-l-indigo-600',  bg: 'bg-indigo-50/60',  iconBg: 'bg-indigo-600',  iconColor: 'text-white',    valueColor: 'text-indigo-700' },
    revenue: { border: 'border-l-emerald-600', bg: 'bg-emerald-50/60', iconBg: 'bg-emerald-600', iconColor: 'text-white',    valueColor: 'text-emerald-700' },
    feed:    { border: 'border-l-amber-600',   bg: 'bg-amber-50/60',   iconBg: 'bg-amber-600',   iconColor: 'text-white',    valueColor: 'text-amber-700' },
  };

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ key, icon: Icon, label, value, prefix, suffix, decimals, sub }) => {
        const meta = statMeta[key];

        return (
          <div
            key={label}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-border/70 px-4 py-3.5 transition-all duration-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md',
              'border-l-[4px]',
              meta.bg,
              meta.border
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm', meta.iconBg)}>
                <Icon className={cn('w-5 h-5', meta.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">{label}</p>
                <p className={cn('text-xl font-bold font-heading leading-tight', meta.valueColor)}>
                  <AnimatedCounter
                    value={value}
                    prefix={prefix}
                    suffix={suffix}
                    decimals={decimals}
                    duration={1.5}
                  />
                </p>
                <p className="text-xs text-foreground/50 leading-tight font-medium">{sub}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
