'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowRightLeft, Fish, Banknote } from 'lucide-react';
import type { Movimentacao } from '@/lib/types';

const SHORT_MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

type Mode = 'inclusao' | 'transferencia' | 'venda';

interface ModeConfig {
  label: string;
  icon: typeof Fish;
  title: string;
  totalNoun: string; // ex.: "peixes incluídos"
  countNoun: [string, string]; // [singular, plural]
  tooltipWord: string; // ex.: "Incluídos"
  emptyTitle: string;
  emptyHint: string;
  match: (m: Movimentacao) => boolean;
}

const MODE_CONFIG: Record<Mode, ModeConfig> = {
  inclusao: {
    label: 'Inclusão',
    icon: Fish,
    title: 'Inclusões de peixes',
    totalNoun: 'peixes incluídos',
    countNoun: ['inclusão', 'inclusões'],
    tooltipWord: 'Incluídos',
    emptyTitle: 'Nenhuma inclusão de peixes ainda',
    emptyHint: 'Inclusões de alevinos feitas no painel de um tanque aparecem aqui ao longo do tempo.',
    match: (m) => m.tipo === 'povoamento' && m.direcao === 'entrada',
  },
  transferencia: {
    label: 'Transferência',
    icon: ArrowRightLeft,
    title: 'Transferências entre tanques',
    totalNoun: 'peixes movidos',
    countNoun: ['transferência', 'transferências'],
    tooltipWord: 'Movidos',
    emptyTitle: 'Nenhuma transferência entre tanques ainda',
    emptyHint: 'Transferências feitas no painel de um tanque aparecem aqui ao longo do tempo.',
    match: (m) => m.tipo === 'transferencia' && m.direcao === 'saida' && m.tankDestino != null,
  },
  venda: {
    label: 'Venda',
    icon: Banknote,
    title: 'Vendas de peixe',
    totalNoun: 'peixes vendidos',
    countNoun: ['venda', 'vendas'],
    tooltipWord: 'Vendidos',
    emptyTitle: 'Nenhuma venda de peixe ainda',
    emptyHint: 'Vendas lançadas em Custos e vinculadas a um tanque aparecem aqui ao longo do tempo.',
    match: (m) => m.tipo === 'venda',
  },
};

const MODE_ORDER: Mode[] = ['inclusao', 'transferencia', 'venda'];

interface ChartPoint {
  periodo: string;
  valor: number;
  count: number;
}

interface TooltipPayloadItem {
  value: number;
  payload: ChartPoint;
}

function ChartTooltip({
  active,
  payload,
  label,
  word,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  word: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const valor = Number(payload[0].value ?? 0);
  const count = payload[0].payload?.count ?? 0;
  return (
    <div className="rounded-xl bg-slate-900/90 p-3 text-xs text-white shadow-xl">
      <p className="font-semibold capitalize">{label}</p>
      <p className="mt-1 text-slate-200">
        {word}: <span className="font-bold text-white">{valor.toLocaleString('pt-BR')} un</span>
      </p>
      <p className="text-slate-300">
        {count} {count === 1 ? 'registro' : 'registros'}
      </p>
    </div>
  );
}

export default function TransfersTimeline() {
  const movimentacoes = useStore((s) => s.activeMovimentacoes);
  const [mode, setMode] = useState<Mode>('transferencia');

  const config = MODE_CONFIG[mode];

  const { chartData, totalCount, totalMoved } = useMemo(() => {
    const items = movimentacoes.filter(MODE_CONFIG[mode].match);

    // Agrega a quantidade por mês, em ordem cronológica crescente (eixo X).
    const map = new Map<string, { ano: number; mes: number; valor: number; count: number }>();
    for (const m of items) {
      const key = `${m.ano}-${String(m.mes).padStart(2, '0')}`;
      const g = map.get(key) ?? { ano: m.ano, mes: m.mes, valor: 0, count: 0 };
      g.valor += m.quantidade;
      g.count += 1;
      map.set(key, g);
    }

    const data: ChartPoint[] = Array.from(map.values())
      .sort((a, b) => a.ano - b.ano || a.mes - b.mes)
      .map((g) => ({
        periodo: `${SHORT_MONTHS[g.mes - 1] ?? '—'}/${String(g.ano).slice(2)}`,
        valor: g.valor,
        count: g.count,
      }));

    return {
      chartData: data,
      totalCount: items.length,
      totalMoved: items.reduce((s, m) => s + m.quantidade, 0),
    };
  }, [movimentacoes, mode]);

  const HeaderIcon = config.icon;
  const subtitle =
    totalCount === 0
      ? `Nenhuma ${config.countNoun[0]} registrada`
      : `${totalCount} ${totalCount === 1 ? config.countNoun[0] : config.countNoun[1]} · ${totalMoved.toLocaleString('pt-BR')} ${config.totalNoun}`;

  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/90 p-4 shadow-sm shadow-blue-950/5 backdrop-blur-sm sm:p-5">
      {/* Marca d'água do header */}
      <HeaderIcon
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 -z-10 h-28 w-28 -rotate-12 text-brand/[0.06]"
      />
      {/* Header + toggle Inclusão / Transferência / Venda */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">{config.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
          {MODE_ORDER.map((value) => {
            const opt = MODE_CONFIG[value];
            const Icon = opt.icon;
            const isActive = mode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gráfico de linha temporal */}
      {chartData.length > 0 ? (
        <div className="min-h-[220px] w-full flex-1 sm:min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 14, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="periodo"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={44}
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickFormatter={(v) => Number(v).toLocaleString('pt-BR')}
              />
              <Tooltip
                content={<ChartTooltip word={config.tooltipWord} />}
                cursor={{ stroke: 'var(--brand)', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="var(--brand)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--brand)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <HeaderIcon className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-muted-foreground">{config.emptyTitle}</p>
          <p className="mt-1 max-w-[240px] text-xs text-muted-foreground/70">{config.emptyHint}</p>
        </div>
      )}
    </div>
  );
}
