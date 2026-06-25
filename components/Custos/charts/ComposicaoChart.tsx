'use client';

import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import type { FatiaCategoria } from '@/lib/lancamentos';
import type { TipoLancamento } from '@/lib/types';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';
import { ChartTooltip } from './chartTooltip';

interface ComposicaoChartProps {
  custo: FatiaCategoria[];
  receita: FatiaCategoria[];
}

/** Donut da composição por categoria, com toggle interno Custos/Receitas. */
export default function ComposicaoChart({ custo, receita }: ComposicaoChartProps) {
  const [tipo, setTipo] = useState<TipoLancamento>('custo');
  const fatias = tipo === 'receita' ? receita : custo;
  const total = fatias.reduce((s, f) => s + f.valor, 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Composição por categoria</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Peso de cada categoria no período.</p>
        </div>
        <div className="inline-flex shrink-0 rounded-lg border border-border bg-muted/40 p-0.5">
          {(['custo', 'receita'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                tipo === t
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'custo' ? 'Custos' : 'Receitas'}
            </button>
          ))}
        </div>
      </div>

      {fatias.length === 0 ? (
        <EmptyState
          icon={PieIcon}
          title={`Sem ${tipo === 'receita' ? 'receitas' : 'custos'} no período`}
          description="Registre lançamentos para ver a composição."
        />
      ) : (
        <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-[200px] w-full max-w-[220px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fatias}
                  dataKey="valor"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="85%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {fatias.map((f) => (
                    <Cell key={f.categoria} fill={f.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {formatBRL(total)}
              </span>
            </div>
          </div>

          <ul className="w-full flex-1 space-y-1.5">
            {fatias.map((f) => {
              const share = total > 0 ? (f.valor / total) * 100 : 0;
              return (
                <li key={f.categoria} className="flex items-center gap-2 text-xs">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: f.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">{f.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {share.toFixed(0)}%
                  </span>
                  <span className="w-20 shrink-0 text-right font-medium tabular-nums text-foreground">
                    {formatBRL(f.valor)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
