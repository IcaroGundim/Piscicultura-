'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Lancamento } from '@/lib/types';
import { composicaoPorCategoria, resumoAnual, resumoMensal } from '@/lib/lancamentos';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Charts carregam o recharts (lib pesada) sob demanda e apenas no cliente —
// fora do bundle inicial e sem render no servidor (onde o ResponsiveContainer
// não tem dimensões e emite avisos de width/height -1).
const ChartSkeleton = () => (
  <div className="min-h-[300px] w-full animate-pulse rounded-2xl border border-border bg-muted/30" />
);

const ResultadoChart = dynamic(() => import('./charts/ResultadoChart'), {
  ssr: false,
  loading: ChartSkeleton,
});
const ComposicaoChart = dynamic(() => import('./charts/ComposicaoChart'), {
  ssr: false,
  loading: ChartSkeleton,
});
const TendenciaChart = dynamic(() => import('./charts/TendenciaChart'), {
  ssr: false,
  loading: ChartSkeleton,
});

export type Granularidade = 'mensal' | 'anual';

interface ResumoControlsProps {
  granularidade: Granularidade;
  onGranularidadeChange: (g: Granularidade) => void;
  ano: number;
  onAnoChange: (ano: number) => void;
  anos: number[];
}

/** Controles (Mensal/Anual + Ano) renderizados na barra de abas da página. */
export function ResumoControls({
  granularidade,
  onGranularidadeChange,
  ano,
  onAnoChange,
  anos,
}: ResumoControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
        {(['mensal', 'anual'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGranularidadeChange(g)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              granularidade === g
                ? 'bg-brand text-brand-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {g === 'mensal' ? 'Mensal' : 'Anual'}
          </button>
        ))}
      </div>

      <Select
        value={String(ano)}
        onValueChange={(v) => onAnoChange(Number(v))}
        disabled={granularidade !== 'mensal'}
      >
        <SelectTrigger
          title={
            granularidade === 'mensal'
              ? 'Ano exibido'
              : 'No modo Anual todos os anos são considerados'
          }
          className="h-9 w-28 rounded-md border-input bg-background font-medium shadow-none hover:bg-muted/30 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SelectValue>
            <span className="truncate">{ano}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false} sideOffset={4}>
          {anos.map((a) => (
            <SelectItem key={a} value={String(a)}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ResumoPanelProps {
  lancamentos: Lancamento[];
  granularidade: Granularidade;
  ano: number;
}

export default function ResumoPanel({ lancamentos, granularidade, ano }: ResumoPanelProps) {
  const isMensal = granularidade === 'mensal';

  const serie = useMemo(
    () => (isMensal ? resumoMensal(lancamentos, ano) : resumoAnual(lancamentos)),
    [isMensal, lancamentos, ano]
  );

  // Composição: filtra pelo ano no modo mensal; agrega todos os anos no modo anual.
  const composicaoAno = isMensal ? ano : undefined;
  const custoFatias = useMemo(
    () => composicaoPorCategoria(lancamentos, 'custo', composicaoAno),
    [lancamentos, composicaoAno]
  );
  const receitaFatias = useMemo(
    () => composicaoPorCategoria(lancamentos, 'receita', composicaoAno),
    [lancamentos, composicaoAno]
  );

  const tendenciaLegenda = isMensal ? `ao longo de ${ano}` : 'por ano';

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ResultadoChart data={serie} />
      <ComposicaoChart custo={custoFatias} receita={receitaFatias} />
      <div className="lg:col-span-2">
        <TendenciaChart data={serie} legenda={tendenciaLegenda} />
      </div>
    </div>
  );
}
