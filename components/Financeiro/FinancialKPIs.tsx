'use client';

import { useProductionMetrics } from '@/lib/hooks/useProductionMetrics';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancialKPIs() {
  const {
    totalFish,
    totalBiomass,
    totalFeedMonthly,
    activeTanks,
    premissas,
  } = useProductionMetrics();

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
    <div role="region" aria-label="Resumo de produção" className="h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border bg-muted/30 shrink-0">
        <h2 className="text-sm font-bold text-foreground tracking-tight">
          Resumo de Produção
        </h2>
      </div>

      {/* Main Content */}
      <div className="p-5 flex flex-col gap-4 flex-1 justify-between">

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
