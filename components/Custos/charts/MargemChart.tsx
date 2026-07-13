'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Percent } from 'lucide-react';
import type { ResumoPonto } from '@/lib/lancamentos';
import { formatBRL, formatPercent } from '@/lib/format';
import EmptyState from '@/components/EmptyState';

interface MargemChartProps {
  data: ResumoPonto[];
  /** Texto que descreve o eixo X, ex.: "ao longo de 2026" ou "por ano". */
  legenda?: string;
}

interface MargemPonto extends ResumoPonto {
  /** Margem líquida (%) = resultado / receita. `null` quando não há receita. */
  margem: number | null;
}

/**
 * Margem líquida por período: resultado ÷ receita (%). Períodos sem receita
 * ficam como lacuna (não há margem definida). Linha de referência em 0% marca
 * o ponto de equilíbrio — acima é lucro, abaixo é prejuízo.
 */
export default function MargemChart({ data, legenda }: MargemChartProps) {
  const chartData = useMemo<MargemPonto[]>(
    () =>
      data.map((p) => ({
        ...p,
        margem: p.receita > 0 ? (p.resultado / p.receita) * 100 : null,
      })),
    [data]
  );

  const semDados = chartData.every((p) => p.margem === null);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">Margem líquida</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Quanto sobra da receita como resultado {legenda ?? 'no tempo'}. Acima de 0% é lucro.
        </p>
      </div>

      {semDados ? (
        <EmptyState
          icon={Percent}
          title="Sem receita no período"
          description="A margem depende de receitas registradas para ser calculada."
        />
      ) : (
        <div className="min-h-[240px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
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
                tickFormatter={(v) => formatPercent(Number(v), 0)}
                width={48}
              />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
              <Tooltip content={<MargemTooltip />} />
              <Line
                dataKey="margem"
                name="Margem"
                type="monotone"
                stroke="#6366f1"
                strokeWidth={2.5}
                connectNulls={false}
                dot={{ r: 2.5, fill: '#6366f1' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

interface MargemTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: MargemPonto }>;
  label?: string;
}

/** Tooltip da margem: percentual em destaque + receita/resultado que a compõem. */
function MargemTooltip({ active, payload, label }: MargemTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const ponto = payload[0]?.payload;
  if (!ponto) return null;

  return (
    <div className="space-y-1 rounded-xl bg-slate-900/90 p-3 text-xs text-white shadow-xl">
      {label && <p className="font-semibold">{label}</p>}
      <p className="text-slate-200">
        Margem:{' '}
        <span className="font-bold text-white">
          {ponto.margem === null ? '—' : formatPercent(ponto.margem)}
        </span>
      </p>
      <p className="text-slate-200">
        Resultado:{' '}
        <span className="font-bold text-white">{formatBRL(ponto.resultado)}</span>
      </p>
      <p className="text-slate-200">
        Receita: <span className="font-bold text-white">{formatBRL(ponto.receita)}</span>
      </p>
    </div>
  );
}
