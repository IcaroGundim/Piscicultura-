'use client';

import { useId } from 'react';
import type { Premissas } from '@/lib/types';
import { cn } from '@/lib/utils';
import PhaseFlow from './PhaseFlow';

interface PremissasCardProps {
  premissas: Premissas;
  periodFactor: number;
  periodLabelShort: string;
  onSetPremissa: <K extends keyof Premissas>(key: K, value: Premissas[K]) => void;
  bare?: boolean;
  headerless?: boolean;
}

export default function PremissasCard({
  premissas,
  periodFactor,
  periodLabelShort,
  onSetPremissa,
  bare = false,
  headerless = false,
}: PremissasCardProps) {
  const fromStored = (annual: number) => annual * periodFactor;
  const toStored = (display: number) => (periodFactor > 0 ? display / periodFactor : display);

  return (
    <div
      className={cn(
        'flex flex-col',
        !bare && 'overflow-hidden rounded-2xl border border-border bg-card shadow-sm'
      )}
    >
      {!headerless && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">Premissas</h2>
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {periodLabelShort}
          </span>
        </div>
      )}

      {/* Body: 2 colunas lado-a-lado */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 md:divide-x divide-border">
        <PremissaColumn title="Produção">
          <PremissaRow
            label="Produção"
            value={fromStored(premissas.producao_anual)}
            unit={`kg/${periodLabelShort}`}
            step="1000"
            onChange={(v) => onSetPremissa('producao_anual', toStored(v))}
            hint={
              premissas.producao_anual > 0
                ? `${(fromStored(premissas.producao_anual) / 1000).toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })} t`
                : undefined
            }
          />
          <PremissaRow
            label="Conv. alimentar"
            value={premissas.conversao_alimentar}
            unit="kg/kg"
            onChange={(v) => onSetPremissa('conversao_alimentar', v)}
          />
          <PremissaRow
            label="Ciclos / ano"
            value={premissas.ciclos_ano}
            unit="ciclos"
            onChange={(v) => onSetPremissa('ciclos_ano', v)}
          />
          <PremissaRow
            label="Preço de venda"
            value={premissas.preco_venda}
            unit="R$/kg"
            onChange={(v) => onSetPremissa('preco_venda', v)}
          />
          <PremissaRow
            label="Período engorda"
            value={premissas.periodo_engorda}
            unit="meses"
            step="1"
            onChange={(v) => onSetPremissa('periodo_engorda', v)}
          />
          <PremissaRow
            label="Período recria"
            value={premissas.periodo_recria}
            unit="meses"
            step="1"
            onChange={(v) => onSetPremissa('periodo_recria', v)}
          />
        </PremissaColumn>

        <PremissaColumn title="Transferências">
          <PremissaRow
            label="Berçário → Recria"
            value={premissas.peso_transfer_bercario}
            unit="kg/peixe"
            onChange={(v) => onSetPremissa('peso_transfer_bercario', v)}
          />
          <PremissaRow
            label="Recria → Engorda"
            value={premissas.peso_transfer_recria}
            unit="kg/peixe"
            onChange={(v) => onSetPremissa('peso_transfer_recria', v)}
          />
          <PremissaRow
            label="Peso final engorda"
            value={premissas.peso_final_engorda}
            unit="kg/peixe"
            onChange={(v) => onSetPremissa('peso_final_engorda', v)}
          />
        </PremissaColumn>
      </div>

      {/* Footer: PhaseFlow esticado */}
      <div className="border-t border-border bg-muted/10 px-4 py-3">
        <PhaseFlow
          fromKg={premissas.peso_transfer_bercario}
          midKg={premissas.peso_transfer_recria}
        />
      </div>
    </div>
  );
}

interface PremissaColumnProps {
  title: string;
  children: React.ReactNode;
}

function PremissaColumn({ title, children }: PremissaColumnProps) {
  return (
    <div className="flex flex-col">
      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

interface PremissaRowProps {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  step?: string;
  hint?: string;
}

function PremissaRow({ label, value, unit, onChange, step = 'any', hint }: PremissaRowProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex cursor-text items-center justify-between gap-3 px-4 py-2.5 transition-colors',
        'hover:bg-muted/30 focus-within:bg-muted/40'
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm text-foreground/80">{label}</span>
        {hint && (
          <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 border-b border-transparent group-focus-within:border-primary">
        <input
          id={id}
          type="number"
          step={step}
          min={0}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value.replace(',', '.'));
            onChange(Number.isFinite(n) && n >= 0 ? n : 0);
          }}
          className={cn(
            'w-24 bg-transparent text-right font-mono text-base font-semibold tabular-nums text-foreground outline-none',
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          )}
        />
        <span className="font-mono text-[11px] text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}
