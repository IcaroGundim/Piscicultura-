'use client';

import { useProductionMetrics } from '@/lib/hooks/useProductionMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign } from 'lucide-react';

export default function FinancialKPIs() {
  const {
    totalFish,
    totalBiomass,
    totalFeedMonthly,
    receita,
    custoRacao,
    outrasDespesas,
    lucro,
    margemLucro,
    isProfitable,
    activeTanks,
    premissas,
  } = useProductionMetrics();

  // Safe percentage calculations to prevent division by zero
  const custoPercent = receita > 0 ? ((custoRacao + outrasDespesas) / receita) * 100 : 0;
  const lucroPercent = receita > 0 ? (lucro / receita) * 100 : 0;
  const receitaForBar = receita > 0 ? receita : 1; // prevent NaN

  const isLoading = totalFish === 0 && totalBiomass === 0 && activeTanks === 0;

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col p-6 gap-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-full" />
        <div className="grid grid-cols-3 gap-3 pt-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Resumo financeiro" className="h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border bg-muted/30 shrink-0">
        <h2 className="text-sm font-bold text-foreground tracking-tight">
          Resumo Financeiro
        </h2>
      </div>

      {/* Main Content */}
      <div className="p-5 flex flex-col gap-4 flex-1 justify-between">

        {/* Revenue Block */}
        <div className="bg-emerald-500/5 rounded-xl p-5 border border-emerald-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Receita Anual</span>
            </div>
            <span className="text-xl font-bold text-emerald-700 font-heading">
              R$ {receita.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Costs Block */}
        <div className="bg-rose-500/5 rounded-xl p-5 border border-rose-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-700" />
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Custos Totais</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-rose-700 font-heading">
                R$ {(custoRacao + outrasDespesas).toLocaleString('pt-BR')}
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-rose-500/80">Ração: R$ {custoRacao.toLocaleString('pt-BR')}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">Outros: R$ {outrasDespesas.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit & Margin Row */}
        <div className="grid grid-cols-1 gap-4">
          <div className={`rounded-xl p-4 border ${isProfitable ? 'bg-emerald-50/80 border-emerald-200/80' : 'bg-orange-50/80 border-orange-200/80'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isProfitable ? 'text-emerald-700' : 'text-orange-700'}`}>
                  Lucro Líquido
                </span>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {margemLucro}% margem
                </div>
              </div>
              <span className={`text-2xl font-bold ${isProfitable ? 'text-emerald-700' : 'text-orange-700'} font-heading`}>
                R$ {lucro.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Profit Margin Bar */}
        <div className="mt-2 px-1">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Composição do Resultado</span>
          </div>
          <div className="h-6 rounded-lg overflow-hidden flex shadow-inner group cursor-pointer">
            {lucro >= 0 ? (
              <>
                <div
                  className="h-full bg-rose-500 flex items-center justify-center transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ width: `${Math.min(custoPercent, 100)}%` }}
                  title={`Custos: R$ ${(custoRacao + outrasDespesas).toLocaleString('pt-BR')} (${custoPercent.toFixed(2)}%)`}
                >
                  <span className="text-xs font-bold text-white">{custoPercent.toFixed(2)}%</span>
                </div>
                <div
                  className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ width: `${Math.min(Math.max(lucroPercent, 0), 100)}%` }}
                  title={`Lucro: R$ ${lucro.toLocaleString('pt-BR')} (${lucroPercent.toFixed(2)}%)`}
                >
                  <span className="text-xs font-bold text-white">{lucroPercent.toFixed(2)}%</span>
                </div>
              </>
            ) : (
              <>
                <div
                  className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ width: `${Math.min((receita / receitaForBar) * 100, 100)}%` }}
                  title={`Receita: R$ ${receita.toLocaleString('pt-BR')}`}
                >
                  <span className="text-xs font-bold text-white">{((receita / receitaForBar) * 100).toFixed(2)}%</span>
                </div>
                <div
                  className="h-full bg-rose-600 flex items-center justify-center transition-all duration-300 group-hover:brightness-110 relative"
                  style={{ width: `${Math.min(((-lucro) / receitaForBar) * 100, 100)}%` }}
                  title={`Prejuízo: R$ ${(-lucro).toLocaleString('pt-BR')}`}
                >
                  <span className="text-xs font-bold text-white">{(((-lucro) / receitaForBar) * 100).toFixed(2)}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-3">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground font-heading">
              {totalFish.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Peixes</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-xl font-bold text-foreground font-heading">
              {totalBiomass.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Biomassa</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground font-heading">
              {activeTanks}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Tanques</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-5 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-muted-foreground">{premissas.ciclos_ano} ciclos/ano</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-muted-foreground">{totalFeedMonthly.toFixed(1)} sc/mês</span>
          </div>
        </div>
      </div>
    </div>
  );
}
