'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { Premissas, Custos } from '@/lib/types';
import { Check, TrendingUp, DollarSign, Settings } from 'lucide-react';

function Field({
  label,
  value,
  onChange,
  unit,
  step = '0.01',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
        {label} {unit && <span className="text-slate-400 normal-case">({unit})</span>}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm shadow-blue-950/5 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function PremissasPage() {
  const { premissas, custos, updatePremissas, updateCustos } = useStore();

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
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
            Premissas & Configurações
          </h1>
          <p className="text-sm text-slate-500 mt-1">Parâmetros globais de produção e financeiros</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 ${
            saved
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
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
            <Field
              label="Produção Anual" unit="kg"
              value={localPremissas.producao_anual}
              onChange={(v) => setLocalPremissas({ ...localPremissas, producao_anual: v })}
              step="1000"
            />
            <Field
              label="Conversão Alimentar" unit="kg/kg"
              value={localPremissas.conversao_alimentar}
              onChange={(v) => setLocalPremissas({ ...localPremissas, conversao_alimentar: v })}
            />
            <Field
              label="Ciclos/Ano" unit="ciclos"
              value={localPremissas.ciclos_ano}
              onChange={(v) => setLocalPremissas({ ...localPremissas, ciclos_ano: v })}
            />
            <Field
              label="Preço de Venda" unit="R$/kg"
              value={localPremissas.preco_venda}
              onChange={(v) => setLocalPremissas({ ...localPremissas, preco_venda: v })}
            />
            <Field
              label="Período Engorda" unit="meses"
              value={localPremissas.periodo_engorda}
              onChange={(v) => setLocalPremissas({ ...localPremissas, periodo_engorda: v })}
              step="1"
            />
            <Field
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
            <Field
              label="Peso Final Engorda" unit="kg"
              value={localPremissas.peso_final_engorda}
              onChange={(v) => setLocalPremissas({ ...localPremissas, peso_final_engorda: v })}
            />
            <Field
              label="Transf. Recria→Engorda" unit="kg"
              value={localPremissas.peso_transfer_recria}
              onChange={(v) => setLocalPremissas({ ...localPremissas, peso_transfer_recria: v })}
            />
            <Field
              label="Transf. Berçário→Recria" unit="kg"
              value={localPremissas.peso_transfer_bercario}
              onChange={(v) => setLocalPremissas({ ...localPremissas, peso_transfer_bercario: v })}
            />
          </div>

          {/* Transfer flow visual */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700">Berçário</span>
            <span className="text-slate-400">→ {localPremissas.peso_transfer_bercario} kg →</span>
            <span className="px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700">Recria</span>
            <span className="text-slate-400">→ {localPremissas.peso_transfer_recria} kg →</span>
            <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">Engorda</span>
          </div>
        </SectionCard>

        {/* Custos */}
        <SectionCard title="Financeiro Anual" icon={TrendingUp}>
          <div className="grid grid-cols-1 gap-3">
            <Field
              label="Receita — Venda de Peixes" unit="R$"
              value={localCustos.receita_venda}
              onChange={(v) => setLocalCustos({ ...localCustos, receita_venda: v })}
              step="10000"
            />
            <Field
              label="Custo — Ração" unit="R$"
              value={localCustos.custo_racao}
              onChange={(v) => setLocalCustos({ ...localCustos, custo_racao: v })}
              step="10000"
            />
            <Field
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
              <span className="text-sm text-slate-500">Receita Total</span>
              <span className="text-sm font-semibold text-emerald-600">
                R$ {localCustos.receita_venda.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-slate-500">Custo Ração</span>
              <span className="text-sm font-semibold text-red-600">
                − R$ {localCustos.custo_racao.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-slate-500">Outras Despesas</span>
              <span className="text-sm font-semibold text-red-600">
                − R$ {localCustos.outras_despesas.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
                Lucro Estimado/Ano
              </span>
              <div className="text-right">
                <p className={`text-lg font-bold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                   style={{ fontFamily: 'var(--font-syne)' }}>
                  R$ {lucro.toLocaleString('pt-BR')}
                </p>
                <p className={`text-xs ${lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  margem {margemLucro}%
                </p>
              </div>
            </div>

            {/* Margin bar */}
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
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
