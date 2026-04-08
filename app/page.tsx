'use client';

import { useState } from 'react';
import StatsBar from '@/components/StatsBar';
import TankGrid from '@/components/TankGrid';
import { useStore } from '@/lib/store';
import type { Premissas, Custos } from '@/lib/types';
import { Check, Settings, ChevronDown, ChevronUp } from 'lucide-react';

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
      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
        {label} {unit && <span className="text-slate-400 normal-case">({unit})</span>}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}

export default function Dashboard() {
  const { premissas, custos, updatePremissas, updateCustos } = useStore();

  const [localPremissas, setLocalPremissas] = useState<Premissas>({ ...premissas });
  const [localCustos, setLocalCustos] = useState<Custos>({ ...custos });
  const [saved, setSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="relative flex h-screen flex-col px-4 py-6 lg:px-6">
      {/* KPI bar */}
      <div className="mb-3 shrink-0">
        <StatsBar />
      </div>

      {/* Premissas compact panel */}
      <div className="mb-4 shrink-0">
        <div className="rounded-2xl border border-border/70 bg-card/90 shadow-sm shadow-blue-950/5 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50">
                <Settings className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
                Premissas & Configurações
              </span>
              <span className="text-xs text-slate-400 hidden sm:block">
                (produção, pesos de transferência, financeiro)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-200 cursor-pointer ${
                  saved
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Check className="w-3 h-3" />
                {saved ? 'Salvo!' : 'Salvar'}
              </div>
              {showSettings ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </button>

          {/* Settings content */}
          {showSettings && (
            <div className="border-t border-border/70 px-4 py-4 bg-slate-50/30">
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Parâmetros de Produção */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-xs font-bold text-slate-700 mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
                    Parâmetros de Produção
                  </h3>
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
                </div>

                {/* Pesos de Transferência */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-xs font-bold text-slate-700 mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
                    Pesos de Transferência
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
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
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">Berçário</span>
                    <span className="text-slate-400">→ {localPremissas.peso_transfer_bercario} kg</span>
                    <span className="px-1.5 py-0.5 rounded bg-green-50 border border-green-200 text-green-700">Recria</span>
                    <span className="text-slate-400">→ {localPremissas.peso_transfer_recria} kg</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">Engorda</span>
                  </div>
                </div>

                {/* Financeiro */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-xs font-bold text-slate-700 mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
                    Financeiro Anual
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Field
                      label="Receita — Venda" unit="R$"
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tank grid + detail panel */}
      <div className="min-h-0 flex-1">
        <TankGrid />
      </div>
    </div>
  );
}
