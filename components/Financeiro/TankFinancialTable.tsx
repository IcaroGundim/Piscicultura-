'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS, PHASE_COLORS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Droplets, Scale, Fish, TrendingUp } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

export default function TankFinancialTable() {
  const tanks = useStore((s) => s.activeTanks);
  const bercarioLotes = useStore((s) => s.activeBercarioLotes);
  const recriaLotes = useStore((s) => s.activeRecriaLotes);
  const engordaLotes = useStore((s) => s.activeEngordaLotes);
  const phaseColors = useStore((s) => s.phaseColors);
  const getLoteData = (tankId: number, phase: TankPhase) => {
    if (phase === 'bercario') return bercarioLotes.find((l) => l.tankId === tankId);
    if (phase === 'recria') return recriaLotes.find((l) => l.tankId === tankId);
    if (phase === 'engorda') return engordaLotes.find((l) => l.tankId === tankId);
    return null;
  };

  const activeTanks = useMemo(() => tanks.filter((t) => t.phase !== 'vazio'), [tanks]);

  const totals = useMemo(() => {
    return activeTanks.reduce(
      (acc, tank) => {
        const lote = getLoteData(tank.id, tank.phase);
        if (!lote) return acc;
        return {
          qtd: acc.qtd + lote.qtd_peixes,
          biomass: acc.biomass + lote.peso_total_kg,
          feed: acc.feed + lote.racao_mes_sc,
        };
      },
      { qtd: 0, biomass: 0, feed: 0 }
    );
  }, [activeTanks]);

  return (
    <div className="rounded-2xl border border-border bg-card/90 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="text-sm font-bold text-foreground">
          Detalhamento por Tanque
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeTanks.length} tanques ativos
        </p>
      </div>

      <div className="overflow-x-auto">
        {activeTanks.length === 0 ? (
          <EmptyState
            icon={Fish}
            title="Nenhum tanque ativo"
            description="Atribua uma fase de produção aos tanques para visualizar o detalhamento financeiro."
          />
        ) : (
          <table role="table" aria-label="Detalhamento financeiro por tanque" className="w-full text-xs">
            <thead role="rowgroup" className="sticky top-0 z-10">
              <tr role="row" className="border-b border-border/60 bg-muted/50">
                <th role="columnheader" scope="col" aria-sort="none" className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Tanque</th>
                <th role="columnheader" scope="col" aria-sort="none" className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Fase</th>
                <th role="columnheader" scope="col" aria-sort="none" className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Fish className="w-3 h-3" /> Qtd
                  </div>
                </th>
                <th role="columnheader" scope="col" aria-sort="none" className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Scale className="w-3 h-3" /> Biomassa
                  </div>
                </th>
                <th role="columnheader" scope="col" aria-sort="none" className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Droplets className="w-3 h-3" /> Densidade
                  </div>
                </th>
                <th role="columnheader" scope="col" aria-sort="none" className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" /> Ração/mês
                  </div>
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {activeTanks.map((tank, index) => {
                const lote = getLoteData(tank.id, tank.phase);
                const qtd = lote?.qtd_peixes ?? 0;
                const biomass = lote?.peso_total_kg ?? 0;
                const density = lote?.densidade_kg_m2 ?? 0;
                const feedMonthly = lote?.racao_mes_sc ?? 0;

                return (
                  <tr
                    role="row"
                    key={tank.id}
                    className={cn(
                      'border-b border-border/40 transition-colors hover:bg-primary/5',
                      index % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                    )}
                  >
                    <td role="cell" className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-foreground font-heading">
                        T{tank.id.toString().padStart(2, '0')}
                      </span>
                      {tank.subfase && (
                        <span className="block text-xs text-muted-foreground">{tank.subfase}</span>
                      )}
                    </td>
                    <td role="cell" className="px-4 py-3 whitespace-nowrap">
                      <span
                        role="status"
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: `${phaseColors[tank.phase] ?? PHASE_COLORS[tank.phase]}15`,
                          color: phaseColors[tank.phase] ?? PHASE_COLORS[tank.phase],
                          borderColor: `${phaseColors[tank.phase] ?? PHASE_COLORS[tank.phase]}30`,
                        }}
                      >
                        {PHASE_LABELS[tank.phase]}
                      </span>
                    </td>
                    <td role="cell" className="px-4 py-3 text-right font-mono text-sm text-foreground tabular-nums whitespace-nowrap">
                      {qtd > 0 ? qtd.toLocaleString('pt-BR') : '—'}
                    </td>
                    <td role="cell" className="px-4 py-3 text-right font-mono text-sm text-foreground tabular-nums whitespace-nowrap">
                      {biomass > 0 ? `${biomass.toLocaleString('pt-BR')} kg` : '—'}
                    </td>
                    <td role="cell" className="px-4 py-3 text-right font-mono text-sm text-foreground tabular-nums whitespace-nowrap">
                      {density > 0 ? `${density.toFixed(2)} kg/m³` : '—'}
                    </td>
                    <td role="cell" className="px-4 py-3 text-right font-mono text-sm text-amber-700 tabular-nums whitespace-nowrap">
                      {feedMonthly > 0 ? `${feedMonthly.toFixed(1)} sc` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr role="row" className="border-t-2 border-border bg-muted/70">
                <td role="cell" className="px-4 py-3 whitespace-nowrap" colSpan={2}>
                    <span className="font-bold text-foreground uppercase tracking-wider text-xs font-heading">
                    Total
                  </span>
                </td>
                <td role="cell" className="px-4 py-3 text-right font-bold text-foreground font-mono text-sm tabular-nums whitespace-nowrap">
                  {totals.qtd > 0 ? totals.qtd.toLocaleString('pt-BR') : '—'}
                </td>
                <td role="cell" className="px-4 py-3 text-right font-bold text-foreground font-mono text-sm tabular-nums whitespace-nowrap">
                  {totals.biomass > 0 ? `${totals.biomass.toLocaleString('pt-BR')} kg` : '—'}
                </td>
                <td role="cell" className="px-4 py-3 text-right font-mono text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                  —
                </td>
                <td role="cell" className="px-4 py-3 text-right font-bold text-amber-700 font-mono text-sm tabular-nums whitespace-nowrap">
                  {totals.feed > 0 ? `${totals.feed.toFixed(1)} sc` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
