'use client';

import { useId } from 'react';
import type { Custos, Premissas } from '@/lib/types';
import { CATEGORIA_CUSTO_COLORS, CATEGORIA_CUSTO_LABELS } from '@/lib/types';
import { CATEGORIAS_CUSTO, totalPorCategoriaCusto } from '@/lib/lancamentos';
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

const fmtBRL = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

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
    <div className="space-y-4">
      {/* Linha: Premissas | Composição de custos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        {/* Card: Premissas */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-brand/30 bg-brand px-5 py-3">
            <h3 className="text-base font-semibold text-brand-foreground">Premissas de produção</h3>
            <p className="mt-0.5 text-xs text-brand-foreground/70">
              {isMensal ? `Valores por mês — ${periodTitle}` : 'Valores anuais'}
            </p>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <CompactRow
                label="Produção"
                value={fromStored(premissas.producao_anual)}
                unit={`kg/${periodLabelShort}`}
                step="1000"
                onChange={(v) => onSetPremissa('producao_anual', toStored(v))}
              />
              <CompactRow
                label="Conversão alimentar"
                value={premissas.conversao_alimentar}
                unit="kg/kg"
                onChange={(v) => onSetPremissa('conversao_alimentar', v)}
              />
              <CompactRow
                label="Ciclos por ano"
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
                label="Período de engorda"
                value={premissas.periodo_engorda}
                unit="meses"
                step="1"
                onChange={(v) => onSetPremissa('periodo_engorda', v)}
              />
              <CompactRow
                label="Período de recria"
                value={premissas.periodo_recria}
                unit="meses"
                step="1"
                onChange={(v) => onSetPremissa('periodo_recria', v)}
              />
            </div>
          </div>
        </div>

        {/* Card: Composição dos custos */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-brand/30 bg-brand px-5 py-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold text-brand-foreground">
                Composição dos custos
              </h3>
              <span className="text-[10px] text-brand-foreground/70">
                edite em <span className="font-medium">Lançamentos</span>
              </span>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="mb-3 border-b border-border/60 pb-3">
              <span className="text-xs text-muted-foreground">
                Custo total {isMensal ? 'mensal' : 'anual'}
              </span>
              <p className="font-mono text-xl font-semibold tabular-nums text-brand">
                {fmtBRL(fromStored(custoTotal))}
              </p>
            </div>
            <div className="space-y-2.5">
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
      </div>

      {/* Card: Ciclo de produção */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-brand/30 bg-brand px-5 py-3">
          <h3 className="text-base font-semibold text-brand-foreground">Ciclo de produção</h3>
          <p className="mt-0.5 text-xs text-brand-foreground/70">
            Pesos de transferência entre fases
          </p>
        </div>
        <div className="px-5 py-4">
          <PhaseFlow
            fromKg={premissas.peso_transfer_bercario}
            midKg={premissas.peso_transfer_recria}
          />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <WeightField
              label="Berçário → Recria"
              value={premissas.peso_transfer_bercario}
              phase="bercario"
              onChange={(v) => onSetPremissa('peso_transfer_bercario', v)}
            />
            <WeightField
              label="Recria → Engorda"
              value={premissas.peso_transfer_recria}
              phase="recria"
              onChange={(v) => onSetPremissa('peso_transfer_recria', v)}
            />
            <WeightField
              label="Peso final engorda"
              value={premissas.peso_final_engorda}
              phase="engorda"
              onChange={(v) => onSetPremissa('peso_final_engorda', v)}
            />
          </div>
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
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label
        htmlFor={id}
        className={cn(
          'shrink-0 text-sm font-medium text-muted-foreground',
          highlight && 'text-foreground'
        )}
      >
        {label}
      </label>
      <span className="flex items-center gap-1.5">
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
            'w-24 rounded-md border border-input bg-background px-2.5 py-1.5 text-right font-mono text-sm font-medium tabular-nums text-foreground outline-none transition-colors',
            'hover:border-foreground/30 focus:border-brand focus:ring-2 focus:ring-brand/20',
            highlight && 'w-28'
          )}
        />
        <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}

type Phase = 'bercario' | 'recria' | 'engorda';

const PHASE_STYLES: Record<Phase, { text: string; border: string }> = {
  bercario: { text: 'text-(--phase-bercario)', border: 'border-b-(--phase-bercario)/40' },
  recria: { text: 'text-(--phase-recria)', border: 'border-b-(--phase-recria)/40' },
  engorda: { text: 'text-(--phase-engorda)', border: 'border-b-(--phase-engorda)/40' },
};

interface WeightFieldProps {
  label: string;
  value: number;
  phase: Phase;
  onChange: (v: number) => void;
}

function WeightField({ label, value, phase, onChange }: WeightFieldProps) {
  const id = useId();
  const s = PHASE_STYLES[phase];
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/20">
      <div className={cn('mb-3 border-b pb-2', s.border)}>
        <span className={cn('text-xs font-semibold', s.text)}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
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
          className="w-full min-w-0 bg-transparent font-mono text-2xl font-bold tabular-nums text-foreground outline-none"
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">kg/peixe</span>
      </div>
    </div>
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
        <span className="min-w-0 truncate text-foreground/80">{label}</span>
        <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
          {fmtBRL(value)}
          <span className="ml-1.5 text-[10px]">{pct.toFixed(1)}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
