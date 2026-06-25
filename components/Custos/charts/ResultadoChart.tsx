'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { ResumoPonto } from '@/lib/lancamentos';
import { formatBRLCompact } from '@/lib/format';
import EmptyState from '@/components/EmptyState';
import { ChartTooltip } from './chartTooltip';

interface ResultadoChartProps {
  data: ResumoPonto[];
}

/** Barras de Custo × Receita por período + linha de Resultado (receita − custo). */
export default function ResultadoChart({ data }: ResultadoChartProps) {
  const semDados = data.every((p) => p.custo === 0 && p.receita === 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">Custos × Receitas × Resultado</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Barras comparam entradas e saídas; a linha mostra o resultado do período.
        </p>
      </div>

      {semDados ? (
        <EmptyState
          icon={BarChart3}
          title="Sem lançamentos no período"
          description="Registre custos ou receitas para visualizar a comparação."
        />
      ) : (
        <div className="min-h-[260px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
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
                tickFormatter={(v) => formatBRLCompact(Number(v))}
                width={64}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="custo"
                name="Custos"
                fill="var(--brand, #1e6b6b)"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
              <Bar
                dataKey="receita"
                name="Receitas"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
              <Line
                dataKey="resultado"
                name="Resultado"
                type="monotone"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
