'use client';

import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL, formatBRLCompact } from '@/lib/format';
import SectionCard from './SectionCard';
import PhaseBadge from '@/components/PhaseBadge';
import type { TankPhase } from '@/lib/types';

interface PhaseData {
  biomass: number;
  racaoKg: number;
  racao: number;
  mao_obra: number;
  outras: number;
  total: number;
}

interface CostBreakdownProps {
  custoRacao: number;
  custoMaoObra: number;
  outrasDespesas: number;
  pctRacao: number;
  pctMaoObra: number;
  pctOutras: number;
  custoTotal: number;
  lucro: number;
  margemLucro: string;
  periodFactor: number;
  periodLabel: string;
  breakdown: {
    bercario: PhaseData;
    recria: PhaseData;
    engorda: PhaseData;
  };
}

export default function CostBreakdown({
  custoRacao,
  custoMaoObra,
  outrasDespesas,
  pctRacao,
  pctMaoObra,
  pctOutras,
  custoTotal,
  lucro,
  margemLucro,
  periodFactor,
  periodLabel,
  breakdown,
}: CostBreakdownProps) {
  const totalAbs = custoTotal * periodFactor;
  const lucroAbs = lucro * periodFactor;

  const categorias = [
    { label: 'Ração', value: custoRacao, pct: pctRacao, dot: 'bg-amber-500' },
    { label: 'Mão de Obra', value: custoMaoObra, pct: pctMaoObra, dot: 'bg-sky-500' },
    { label: 'Outros Custos', value: outrasDespesas, pct: pctOutras, dot: 'bg-slate-500' },
  ];

  const phases: Array<Exclude<TankPhase, 'vazio'>> = ['bercario', 'recria', 'engorda'];
  const grandPhaseTotal =
    breakdown.bercario.total + breakdown.recria.total + breakdown.engorda.total;

  return (
    <SectionCard title="Estrutura de Custos" icon={Coins}>
      <div className="space-y-5">
        {/* Total + Lucro */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Custo Total{periodLabel}</span>
            <span className="text-xl font-bold tabular-nums text-foreground">
              {formatBRL(totalAbs)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Lucro Estimado{periodLabel}</span>
            <span
              className={cn(
                'text-sm font-bold tabular-nums',
                lucroAbs >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {formatBRL(lucroAbs)}{' '}
              <span className="text-xs font-normal text-muted-foreground">({margemLucro}%)</span>
            </span>
          </div>

          {/* Barra empilhada global */}
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${pctRacao}%` }}
              title={`Ração ${pctRacao.toFixed(1)}%`}
            />
            <div
              className="h-full bg-sky-500"
              style={{ width: `${pctMaoObra}%` }}
              title={`Mão de obra ${pctMaoObra.toFixed(1)}%`}
            />
            <div
              className="h-full bg-slate-500"
              style={{ width: `${pctOutras}%` }}
              title={`Outros ${pctOutras.toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Por Categoria */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Por Categoria
          </h3>
          <ul className="divide-y divide-border/60">
            {categorias.map((row) => (
              <li
                key={row.label}
                className="grid grid-cols-[1fr_auto_56px] items-center gap-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 text-foreground">
                  <span className={cn('h-2.5 w-2.5 rounded-full', row.dot)} />
                  {row.label}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatBRL(row.value)}
                </span>
                <span className="text-right text-xs tabular-nums text-muted-foreground">
                  {row.pct.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Por Fase */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Por Fase
          </h3>
          <ul className="grid grid-cols-3 gap-3">
            {phases.map((phase) => {
              const data = breakdown[phase];
              const share = grandPhaseTotal > 0 ? (data.total / grandPhaseTotal) * 100 : 0;
              const totalPhase = data.racao + data.mao_obra + data.outras;
              const racaoPct = totalPhase > 0 ? (data.racao / totalPhase) * 100 : 0;
              const maoPct = totalPhase > 0 ? (data.mao_obra / totalPhase) * 100 : 0;
              const outrasPct = totalPhase > 0 ? (data.outras / totalPhase) * 100 : 0;

              return (
                <li key={phase} className="rounded-xl border border-border/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <PhaseBadge phase={phase} size="sm" showDot />
                    <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                      {share.toFixed(0)}%
                    </span>
                  </div>
                  <span className="block text-base font-bold tabular-nums text-foreground">
                    {formatBRLCompact(data.total)}
                  </span>
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-amber-500" style={{ width: `${racaoPct}%` }} />
                    <div className="h-full bg-sky-500" style={{ width: `${maoPct}%` }} />
                    <div className="h-full bg-slate-500" style={{ width: `${outrasPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] tabular-nums text-muted-foreground">
                    <span>
                      {data.biomass.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg biomassa
                    </span>
                    <span>
                      {data.racaoKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg ração
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </SectionCard>
  );
}
