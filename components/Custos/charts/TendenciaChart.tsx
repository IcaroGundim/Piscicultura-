'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { ResumoPonto } from '@/lib/lancamentos';
import { formatBRLCompact } from '@/lib/format';
import EmptyState from '@/components/EmptyState';
import { ChartTooltip } from './chartTooltip';

interface TendenciaChartProps {
  data: ResumoPonto[];
  /** Texto que descreve o eixo X, ex.: "ao longo de 2026" ou "por ano". */
  legenda?: string;
}

/** Linha de evolução de custos, receitas e resultado no tempo. */
export default function TendenciaChart({ data, legenda }: TendenciaChartProps) {
  const semDados = data.every((p) => p.custo === 0 && p.receita === 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">Tendência</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Evolução {legenda ?? 'no tempo'}.</p>
      </div>

      {semDados ? (
        <EmptyState
          icon={TrendingUp}
          title="Sem dados para a tendência"
          description="Registre lançamentos em mais de um período para ver a evolução."
        />
      ) : (
        <div className="min-h-[240px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
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
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                dataKey="custo"
                name="Custos"
                type="monotone"
                stroke="var(--brand, #1e6b6b)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                dataKey="receita"
                name="Receitas"
                type="monotone"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                dataKey="resultado"
                name="Resultado"
                type="monotone"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
