'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { Premissas, Custos } from '@/lib/types';
import { Check, TrendingUp, DollarSign, Settings } from 'lucide-react';
import { NumberField } from '@/components/forms/NumberField';

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
      <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function PremissasPage() {
  const premissas = useStore((s) => s.premissas);
  const custos = useStore((s) => s.custos);
  const updatePremissas = useStore((s) => s.updatePremissas);
  const updateCustos = useStore((s) => s.updateCustos);

  const [localPremissas, setLocalPremissas] = useState<Premissas>({ ...premissas });
  const [localCustos, setLocalCustos] = useState<Custos>({ ...custos });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updatePremissas(localPremissas);
    updateCustos(localCustos);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const lucro = localCustos.receita_venda - localCustos.custo_racao - localCustos.outras_despesas;
  const margemLucro = localCustos.receita_venda > 0
    ? ((lucro / localCustos.receita_venda) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-4xl px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Premissas & Configurações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Parâmetros globais de produção e financeiros</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 min-h-[44px] ${
            saved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <Check className="w-4 h-4" />
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Premissas de produção */}
        <SectionCard title="Parâmetros de Produção" icon={Settings}>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Produção Anual" unit="kg"
              value={localPremissas.producao_anual}
              onChange={(v) => setLocalPremissas({ ...localPremissas, producao_anual: v })}
              step="1000"
            />
            <NumberField
              label="Conversão Alimentar" unit="kg/kg"
              value={localPremissas.conversao_alimentar}
              onChange={(v) => setLocalPremissas({ ...localPremissas, conversao_alimentar: v })}
            />
            <NumberField
              label="Ciclos/Ano" unit="ciclos"
              value={localPremissas.ciclos_ano}
              onChange={(v) => setLocalPremissas({ ...localPremissas, ciclos_ano: v })}
            />
            <NumberField
              label="Preço de Venda" unit="R$/kg"
              value={localPremissas.preco_venda}
              onChange={(v) => setLocalPremissas({ ...localPremissas, preco_venda: v })}
            />
            <NumberField
              label="Período Engorda" unit="meses"
              value={localPremissas.periodo_engorda}
              onChange={(v) => setLocalPremissas({ ...localPremissas, periodo_engorda: v })}
              step="1"
            />
            <NumberField
              label="Período Recria" unit="meses"
              value={localPremissas.periodo_recria}
              onChange={(v) => setLocalPremissas({ ...localPremissas, periodo_recria: v })}
              step="1"
            />
          </div>
        </SectionCard>

        {/* Pesos de transferência */}
        <SectionCard title="Pesos de Transferência" icon={Settings}>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Peso Final Engorda" unit="kg"
              value={localPremissas.peso_final_engorda}
              onChange={(v) => setLocalPremissas({ ...localPremissas, peso_final_engorda: v })}
            />
            <NumberField
              label="Transf. Recria→Engorda" unit="kg"
              value={localPremissas.peso_transfer_recria}
              onChange={(v) => setLocalPremissas({ ...localPremissas, peso_transfer_recria: v })}
            />
            <NumberField
              label="Transf. Berçário→Recria" unit="kg"
              value={localPremissas.peso_transfer_bercario}
              onChange={(v) => setLocalPremissas({ ...localPremissas, peso_transfer_bercario: v })}
            />
          </div>

          {/* Transfer flow visual */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-400/30 text-blue-700">Berçário</span>
            <span className="text-muted-foreground/60">→ {localPremissas.peso_transfer_bercario} kg →</span>
            <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/30 text-emerald-700">Recria</span>
            <span className="text-muted-foreground/60">→ {localPremissas.peso_transfer_recria} kg →</span>
            <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/30 text-amber-700">Engorda</span>
          </div>
        </SectionCard>

        {/* Custos */}
        <SectionCard title="Financeiro Anual" icon={TrendingUp}>
          <div className="grid grid-cols-1 gap-3">
            <NumberField
              label="Receita — Venda de Peixes" unit="R$"
              value={localCustos.receita_venda}
              onChange={(v) => setLocalCustos({ ...localCustos, receita_venda: v })}
              step="10000"
            />
            <NumberField
              label="Custo — Ração" unit="R$"
              value={localCustos.custo_racao}
              onChange={(v) => setLocalCustos({ ...localCustos, custo_racao: v })}
              step="10000"
            />
            <NumberField
              label="Outras Despesas" unit="R$"
              value={localCustos.outras_despesas}
              onChange={(v) => setLocalCustos({ ...localCustos, outras_despesas: v })}
              step="10000"
            />
          </div>
        </SectionCard>

        {/* Financial summary */}
        <SectionCard title="Resultado Estimado" icon={DollarSign}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Receita Total</span>
              <span className="text-sm font-semibold text-emerald-600">
                R$ {localCustos.receita_venda.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Custo Ração</span>
              <span className="text-sm font-semibold text-red-600">
                − R$ {localCustos.custo_racao.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Outras Despesas</span>
              <span className="text-sm font-semibold text-red-600">
                − R$ {localCustos.outras_despesas.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-foreground font-heading">
                Lucro Estimado/Ano
              </span>
              <div className="text-right">
                <p className={`text-lg font-bold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-600'} font-heading`}>
                  R$ {lucro.toLocaleString('pt-BR')}
                </p>
                <p className={`text-xs ${lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  margem {margemLucro}%
                </p>
              </div>
            </div>

            {/* Margin bar */}
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${lucro >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(parseFloat(margemLucro)), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
