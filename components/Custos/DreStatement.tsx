'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import LedgerRow from './LedgerRow';
import Panel from './Panel';

interface DreStatementProps {
  receitaVenda: number;
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
  periodLabelShort: string;
  periodTitle: string;
  isMensal: boolean;
  onChangeReceita: (v: number) => void;
  bare?: boolean;
  headerless?: boolean;
}

export default function DreStatement({
  receitaVenda,
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
  periodLabelShort,
  periodTitle,
  isMensal,
  onChangeReceita,
  bare = false,
  headerless = false,
}: DreStatementProps) {
  const custoTotalPeriodo = custoTotal * periodFactor;
  const lucroPeriodo = lucro * periodFactor;
  const margemNum = parseFloat(margemLucro);

  return (
    <Panel bare={bare} className="flex flex-col">
      {!headerless && (
        <Panel.Header
          icon={TrendingUp}
          title={isMensal ? `Demonstrativo · ${periodTitle}` : 'Demonstrativo Anual'}
          subtitle={`DRE · ${periodLabelShort}`}
        />
      )}

      <Panel.Section padded={false} className="flex-1">
        <div className="divide-y divide-border/60 font-mono">
          <LedgerRow
            sign="+"
            label={`Receita de Vendas (${periodLabelShort})`}
            value={receitaVenda}
            onChange={onChangeReceita}
            tone="positive"
          />

          <SubtotalRow
            sign="="
            label="Receita Bruta"
            value={receitaVenda}
            tone="positive"
          />

          <div className="bg-muted/10 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              (−) Custos Operacionais
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/70">
              Edite na aba <span className="font-semibold">Lançamentos</span>
            </p>
          </div>

          <LedgerRow
            sign="−"
            label="Ração"
            value={custoRacao}
            percent={pctRacao}
            tone="negative"
            editable={false}
          />
          <LedgerRow
            sign="−"
            label="Mão de Obra"
            value={custoMaoObra}
            percent={pctMaoObra}
            tone="negative"
            editable={false}
          />
          <LedgerRow
            sign="−"
            label="Outros Custos"
            value={outrasDespesas}
            percent={pctOutras}
            tone="negative"
            editable={false}
          />

          <SubtotalRow
            sign="="
            label="Total Custos"
            value={custoTotalPeriodo}
            tone="negative"
          />
        </div>
      </Panel.Section>

      <Panel.Footer>
        <div className="font-mono">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Lucro Líquido
            </span>
            <span
              className={cn(
                'text-[10px] font-bold tabular-nums',
                lucro >= 0 ? 'text-emerald-700' : 'text-red-700'
              )}
            >
              margem {margemLucro}%
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                'text-lg font-bold tracking-tight tabular-nums',
                lucro >= 0 ? 'text-emerald-700' : 'text-red-700'
              )}
            >
              {lucro < 0 && '−'}R${' '}
              {Math.abs(lucroPeriodo).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-muted-foreground">{periodLabel}</span>
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                lucro >= 0 ? 'bg-emerald-500' : 'bg-red-500'
              )}
              style={{
                width: `${Math.min(Math.abs(margemNum), 100)}%`,
              }}
            />
          </div>
        </div>
      </Panel.Footer>
    </Panel>
  );
}

interface SubtotalRowProps {
  sign: '=' | '+' | '−';
  label: string;
  value: number;
  tone: 'positive' | 'negative';
}

function SubtotalRow({ sign, label, value, tone }: SubtotalRowProps) {
  const signColor = tone === 'positive' ? 'text-muted-foreground' : 'text-red-500';
  const valueColor = tone === 'positive' ? 'text-emerald-700' : 'text-red-700';
  return (
    <div className="grid grid-cols-[16px_1fr_auto_44px] items-center gap-2 bg-muted/30 px-3 py-1.5">
      <span className={cn('text-sm font-bold', signColor)}>{sign}</span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={cn('px-1.5 text-sm font-bold tracking-tight tabular-nums', valueColor)}>
        R$ {value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
      </span>
      <span />
    </div>
  );
}
