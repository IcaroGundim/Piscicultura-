'use client';

import { useId } from 'react';
import { Pencil } from 'lucide-react';
import type { Custos, Premissas } from '@/lib/types';
import {
  CATEGORIA_CUSTO_COLORS,
  CATEGORIA_CUSTO_LABELS,
} from '@/lib/types';
import {
  CATEGORIAS_CUSTO,
  totalPorCategoriaCusto,
} from '@/lib/lancamentos';
import { cn } from '@/lib/utils';
import PhaseFlow from './PhaseFlow';

interface ConfiguracoesPanelProps {
  premissas: Premissas;
  custos: Custos;
  periodFactor: number;
  periodLabelShort: string;
  periodTitle: string;
  isMensal: boolean;
  onSetPremissa: <K extends keyof Premissas>(key: K, value: Premissas[K]) => void;
}

const fmtBRL = (n: number) =>
  `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

export default function ConfiguracoesPanel({
  premissas,
  custos,
  periodFactor,
  periodLabelShort,
  periodTitle,
  isMensal,
  onSetPremissa,
}: ConfiguracoesPanelProps) {
  const fromStored = (annual: number) => annual * periodFactor;
  const toStored = (display: number) => (periodFactor > 0 ? display / periodFactor : display);

  const porCategoria = totalPorCategoriaCusto(custos.lancamentos);
  const custoTotal = CATEGORIAS_CUSTO.reduce((sum, cat) => sum + porCategoria[cat], 0);
  const pctOf = (part: number) => (custoTotal > 0 ? (part / custoTotal) * 100 : 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          Configurações · <span className="font-normal text-muted-foreground">{isMensal ? periodTitle : 'visão anual'}</span>
        </h2>
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {periodLabelShort}
        </span>
      </div>

      {/* Linha: Premissas (com Receita dentro) | Composição de custos */}
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-[3fr_1fr] lg:divide-x divide-border">
        {/* Coluna esquerda: Receita + Premissas (compacto) */}
        <div className="px-5 py-5">
          {/* Premissas em grid denso — 2 colunas para casar com altura da composição de custos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <CompactRow
              label="Produção"
              value={fromStored(premissas.producao_anual)}
              unit={`kg/${periodLabelShort}`}
              step="1000"
              onChange={(v) => onSetPremissa('producao_anual', toStored(v))}
            />
            <CompactRow
              label="Conv. alimentar"
              value={premissas.conversao_alimentar}
              unit="kg/kg"
              onChange={(v) => onSetPremissa('conversao_alimentar', v)}
            />
            <CompactRow
              label="Ciclos / ano"
              value={premissas.ciclos_ano}
              unit="ciclos"
              onChange={(v) => onSetPremissa('ciclos_ano', v)}
            />
            <CompactRow
              label="Preço de venda"
              value={premissas.preco_venda}
              unit="R$/kg"
              onChange={(v) => onSetPremissa('preco_venda', v)}
            />
            <CompactRow
              label="Período engorda"
              value={premissas.periodo_engorda}
              unit="meses"
              step="1"
              onChange={(v) => onSetPremissa('periodo_engorda', v)}
            />
            <CompactRow
              label="Período recria"
              value={premissas.periodo_recria}
              unit="meses"
              step="1"
              onChange={(v) => onSetPremissa('periodo_recria', v)}
            />
          </div>
        </div>

        {/* Coluna direita: Composição dos custos */}
        <div className="px-5 py-5">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Composição dos custos
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              edite em <span className="font-semibold">Lançamentos</span>
            </p>
          </div>
          <div className="space-y-4">
            {CATEGORIAS_CUSTO.map((cat) => (
              <CostBar
                key={cat}
                label={CATEGORIA_CUSTO_LABELS[cat]}
                value={fromStored(porCategoria[cat])}
                pct={pctOf(porCategoria[cat])}
                color={CATEGORIA_CUSTO_COLORS[cat]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer: PhaseFlow + pesos de transferência */}
      <div className="bg-muted/10 px-5 py-4">
        <PhaseFlow
          fromKg={premissas.peso_transfer_bercario}
          midKg={premissas.peso_transfer_recria}
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <WeightCard
            label="Berçário → Recria"
            value={premissas.peso_transfer_bercario}
            accent="var(--phase-bercario)"
            onChange={(v) => onSetPremissa('peso_transfer_bercario', v)}
          />
          <WeightCard
            label="Recria → Engorda"
            value={premissas.peso_transfer_recria}
            accent="var(--phase-recria)"
            onChange={(v) => onSetPremissa('peso_transfer_recria', v)}
          />
          <WeightCard
            label="Peso final engorda"
            value={premissas.peso_final_engorda}
            accent="var(--phase-engorda)"
            onChange={(v) => onSetPremissa('peso_final_engorda', v)}
          />
        </div>
      </div>
    </div>
  );
}


interface CompactRowProps {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  step?: string;
  highlight?: boolean;
}

function CompactRow({
  label,
  value,
  unit,
  onChange,
  step = 'any',
  highlight = false,
}: CompactRowProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex cursor-text items-center justify-between gap-2 border-b border-border/50 py-3 transition-colors hover:bg-muted/30 focus-within:bg-muted/40',
        highlight && 'border-b-primary/30 bg-primary/[0.04]'
      )}
    >
      <span
        className={cn(
          'min-w-0 truncate text-sm font-bold uppercase tracking-wider text-muted-foreground',
          highlight && 'text-primary'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'flex items-baseline gap-1.5 rounded-md border-2 border-dashed border-primary/40 bg-background px-3 py-1.5 shadow-sm transition-colors',
          'group-hover:border-primary group-hover:border-solid group-hover:bg-background',
          'group-focus-within:border-primary group-focus-within:border-solid group-focus-within:bg-background group-focus-within:ring-2 group-focus-within:ring-primary/20',
          highlight && 'border-solid border-primary/60 bg-background'
        )}
      >
        <Pencil
          className={cn(
            'h-3 w-3 self-center text-muted-foreground/40 transition-opacity',
            'group-hover:text-primary group-focus-within:opacity-0'
          )}
        />
        <input
          id={id}
          type="text"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value.replace(',', '.'));
            onChange(Number.isFinite(n) && n >= 0 ? n : 0);
          }}
          onFocus={(e) => {
            const len = e.target.value.length;
            e.target.setSelectionRange(len, len);
          }}
          onClick={(e) => {
            const el = e.currentTarget;
            const len = el.value.length;
            el.setSelectionRange(len, len);
          }}
          className={cn(
            'w-24 bg-transparent text-right font-mono text-base font-semibold tabular-nums text-foreground outline-none',
            highlight && 'w-32 text-lg font-bold'
          )}
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{unit}</span>
      </span>
    </label>
  );
}

interface WeightCardProps {
  label: string;
  value: number;
  accent: string;
  onChange: (v: number) => void;
}

function WeightCard({ label, value, accent, onChange }: WeightCardProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'group relative flex cursor-text flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card px-4 py-3 transition-all',
        'hover:border-primary/40 hover:shadow-sm',
        'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
      )}
    >
      {/* Faixa de cor da fase */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
      />
      <span className="flex items-center gap-2 pl-1">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </span>
      <span className="flex items-baseline gap-1.5 pl-1">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          step="any"
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value.replace(',', '.'));
            onChange(Number.isFinite(n) && n >= 0 ? n : 0);
          }}
          onFocus={(e) => {
            const len = e.target.value.length;
            e.target.setSelectionRange(len, len);
          }}
          onClick={(e) => {
            const el = e.currentTarget;
            const len = el.value.length;
            el.setSelectionRange(len, len);
          }}
          className="min-w-0 flex-1 bg-transparent font-mono text-2xl font-bold tabular-nums text-foreground outline-none"
        />
        <Pencil
          className="h-5 w-5 shrink-0 self-center text-primary transition-colors group-hover:text-primary group-focus-within:text-primary"
          style={{ color: accent }}
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">kg/peixe</span>
      </span>
    </label>
  );
}

interface CostBarProps {
  label: string;
  value: number;
  pct: number;
  color: string;
}

function CostBar({ label, value, pct, color }: CostBarProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="truncate font-medium text-foreground/80">{label}</span>
        </span>
        <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
          {fmtBRL(value)}
          <span className="ml-1 text-[10px]">{pct.toFixed(1)}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

