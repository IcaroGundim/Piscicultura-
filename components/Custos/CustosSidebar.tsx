'use client';

import { Fish, Scale, Repeat, Tag, Calendar, ArrowRight, Layers } from 'lucide-react';
import type { Premissas, Custos } from '@/lib/types';
import {
  custoMaoObraAnual,
  custoRacaoAnual,
  outrasDespesasAnuais,
} from '@/lib/lancamentos';
import InlineField from './InlineField';
import PhaseFlow from './PhaseFlow';
import DreStatement from './DreStatement';
import SidebarTabs from './SidebarTabs';

interface CustosSidebarProps {
  premissas: Premissas;
  custos: Custos;
  periodFactor: number;
  periodLabelShort: string;
  periodLabel: string;
  periodTitle: string;
  isMensal: boolean;
  onSetPremissa: <K extends keyof Premissas>(key: K, value: Premissas[K]) => void;
  onSetReceita: (valor: number) => void;
  layout?: 'sidebar' | 'full';
}

export default function CustosSidebar({
  premissas,
  custos,
  periodFactor,
  periodLabelShort,
  periodLabel,
  periodTitle,
  isMensal,
  onSetPremissa,
  onSetReceita,
  layout = 'sidebar',
}: CustosSidebarProps) {
  const fromStored = (annual: number) => annual * periodFactor;
  const toStored = (display: number) => (periodFactor > 0 ? display / periodFactor : display);

  const custoRacao = custoRacaoAnual(custos.lancamentos);
  const custoMaoObra = custoMaoObraAnual(custos.lancamentos);
  const outrasDespesas = outrasDespesasAnuais(custos.lancamentos);
  const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);
  const custoTotal = custoRacao + custoMaoObra + outrasDespesas;
  const lucro = custos.receita_venda - custoTotal;
  const margemLucro = custos.receita_venda > 0
    ? ((lucro / custos.receita_venda) * 100).toFixed(2)
    : '0';

  const tabs = [
    { id: 'producao', label: 'Produção' },
    { id: 'custos', label: 'Custos' },
    { id: 'pesos', label: 'Pesos' },
  ];

  const Wrapper = layout === 'full' ? 'div' : 'aside';
  const wrapperClass =
    layout === 'full'
      ? 'mx-auto w-full max-w-3xl space-y-4'
      : 'w-full shrink-0 space-y-4 lg:sticky lg:top-20 lg:w-80 lg:self-start xl:w-96';

  return (
    <Wrapper className={wrapperClass}>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <SidebarTabs tabs={tabs}>
          {(active) => (
            <>
              {active === 'producao' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InlineField
                      label="Produção"
                      icon={Fish}
                      unit={`kg/${periodLabelShort}`}
                      value={fromStored(premissas.producao_anual)}
                      onChange={(v) => onSetPremissa('producao_anual', toStored(v))}
                      step="1000"
                      hint={
                        premissas.producao_anual > 0
                          ? `${(fromStored(premissas.producao_anual) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`
                          : undefined
                      }
                    />
                    <InlineField
                      label="Conv. Alimentar"
                      icon={Scale}
                      unit="kg/kg"
                      value={premissas.conversao_alimentar}
                      onChange={(v) => onSetPremissa('conversao_alimentar', v)}
                    />
                    <InlineField
                      label="Ciclos/Ano"
                      icon={Repeat}
                      unit="ciclos"
                      value={premissas.ciclos_ano}
                      onChange={(v) => onSetPremissa('ciclos_ano', v)}
                    />
                    <InlineField
                      label="Preço Venda"
                      icon={Tag}
                      unit="R$/kg"
                      value={premissas.preco_venda}
                      onChange={(v) => onSetPremissa('preco_venda', v)}
                    />
                    <InlineField
                      label="Período Engorda"
                      icon={Calendar}
                      unit="meses"
                      value={premissas.periodo_engorda}
                      onChange={(v) => onSetPremissa('periodo_engorda', v)}
                      step="1"
                    />
                    <InlineField
                      label="Período Recria"
                      icon={Calendar}
                      unit="meses"
                      value={premissas.periodo_recria}
                      onChange={(v) => onSetPremissa('periodo_recria', v)}
                      step="1"
                    />
                  </div>


                </div>
              )}

              {active === 'custos' && (
                <DreStatement
                  receitaVenda={fromStored(custos.receita_venda)}
                  custoRacao={fromStored(custoRacao)}
                  custoMaoObra={fromStored(custoMaoObra)}
                  outrasDespesas={fromStored(outrasDespesas)}
                  pctRacao={pct(custoRacao, custoTotal)}
                  pctMaoObra={pct(custoMaoObra, custoTotal)}
                  pctOutras={pct(outrasDespesas, custoTotal)}
                  custoTotal={custoTotal}
                  lucro={lucro}
                  margemLucro={margemLucro}
                  periodFactor={periodFactor}
                  periodLabel={periodLabel}
                  periodLabelShort={periodLabelShort}
                  periodTitle={periodTitle}
                  isMensal={isMensal}
                  onChangeReceita={(v) => onSetReceita(toStored(v))}
                />
              )}

              {active === 'pesos' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Pesos de transferência entre fases</span>
                  </div>
                  <div className="space-y-2.5">
                    <InlineField
                      label="Berçário → Recria"
                      icon={ArrowRight}
                      unit="kg/peixe"
                      value={premissas.peso_transfer_bercario}
                      onChange={(v) => onSetPremissa('peso_transfer_bercario', v)}
                    />
                    <InlineField
                      label="Recria → Engorda"
                      icon={ArrowRight}
                      unit="kg/peixe"
                      value={premissas.peso_transfer_recria}
                      onChange={(v) => onSetPremissa('peso_transfer_recria', v)}
                    />
                    <InlineField
                      label="Peso Final Engorda"
                      icon={Scale}
                      unit="kg/peixe"
                      value={premissas.peso_final_engorda}
                      onChange={(v) => onSetPremissa('peso_final_engorda', v)}
                    />
                  </div>
                  <PhaseFlow
                    fromKg={premissas.peso_transfer_bercario}
                    midKg={premissas.peso_transfer_recria}
                  />
                </div>
              )}
            </>
          )}
        </SidebarTabs>
      </div>

    </Wrapper>
  );
}
