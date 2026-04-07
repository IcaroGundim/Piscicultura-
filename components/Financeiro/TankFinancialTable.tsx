'use client';

import { useStore } from '@/lib/store';
import { PHASE_LABELS, PHASE_COLORS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Droplets, Scale, Fish, DollarSign, TrendingUp } from 'lucide-react';

export default function TankFinancialTable() {
  const { tanks, bercarioLotes, recriaLotes, engordaLotes, premissas } = useStore();

  const getLoteData = (tankId: number, phase: string) => {
    if (phase === 'bercario') return bercarioLotes.find((l) => l.tankId === tankId);
    if (phase === 'recria') return recriaLotes.find((l) => l.tankId === tankId);
    if (phase === 'engorda') return engordaLotes.find((l) => l.tankId === tankId);
    return null;
  };

  const activeTanks = tanks.filter((t) => t.phase !== 'vazio');

  return (
    <div className="rounded-2xl border border-border bg-card/90 shadow-sm shadow-blue-950/5 backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/80 bg-slate-50/85">
        <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
          Detalhamento por Tanque
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {activeTanks.length} tanques ativos · {premissas.preco_venda} R$/kg
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-slate-50/50">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Tanque</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Fase</th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1">
                  <Fish className="w-3 h-3" /> Qtd
                </div>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1">
                  <Scale className="w-3 h-3" /> Biomassa
                </div>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1">
                  <Droplets className="w-3 h-3" /> Densidade
                </div>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1">
                  <DollarSign className="w-3 h-3" /> Receita Est.
                </div>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1">
                  <TrendingUp className="w-3 h-3" /> Ração/mês
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {activeTanks.map((tank) => {
              const lote = getLoteData(tank.id, tank.phase);
              const qtd = lote?.qtd_peixes ?? 0;
              const biomass = lote?.peso_total_kg ?? 0;
              const density = lote?.densidade_kg_m2 ?? 0;
              const revenue = biomass * premissas.preco_venda;
              const feedMonthly = lote?.racao_mes_sc ?? 0;

              return (
                <tr
                  key={tank.id}
                  className="border-b border-border/40 hover:bg-blue-50/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800" style={{ fontFamily: 'var(--font-syne)' }}>
                      T{tank.id.toString().padStart(2, '0')}
                    </span>
                    {tank.subfase && (
                      <span className="block text-[10px] text-slate-400">{tank.subfase}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        backgroundColor: `${PHASE_COLORS[tank.phase]}15`,
                        color: PHASE_COLORS[tank.phase],
                        border: `1px solid ${PHASE_COLORS[tank.phase]}30`,
                      }}
                    >
                      {PHASE_LABELS[tank.phase]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {qtd > 0 ? qtd.toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {biomass > 0 ? `${biomass.toLocaleString('pt-BR')} kg` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {density > 0 ? `${density.toFixed(2)} kg/m²` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-700">
                    {revenue > 0 ? `R$ ${revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-700">
                    {feedMonthly > 0 ? `${feedMonthly.toFixed(1)} sc` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {(() => {
              const totalQtd = activeTanks.reduce((sum, tank) => {
                const lote = getLoteData(tank.id, tank.phase);
                return sum + (lote?.qtd_peixes ?? 0);
              }, 0);
              const totalBiomass = activeTanks.reduce((sum, tank) => {
                const lote = getLoteData(tank.id, tank.phase);
                return sum + (lote?.peso_total_kg ?? 0);
              }, 0);
              const totalRevenue = activeTanks.reduce((sum, tank) => {
                const lote = getLoteData(tank.id, tank.phase);
                const biomass = lote?.peso_total_kg ?? 0;
                return sum + biomass * premissas.preco_venda;
              }, 0);
              const totalFeed = activeTanks.reduce((sum, tank) => {
                const lote = getLoteData(tank.id, tank.phase);
                return sum + (lote?.racao_mes_sc ?? 0);
              }, 0);

              return (
                <tr className="border-t-2 border-slate-300 bg-slate-50/90">
                  <td className="px-4 py-3" colSpan={2}>
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]" style={{ fontFamily: 'var(--font-syne)' }}>
                      Total
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {totalQtd > 0 ? totalQtd.toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {totalBiomass > 0 ? `${totalBiomass.toLocaleString('pt-BR')} kg` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    —
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">
                    {totalRevenue > 0 ? `R$ ${totalRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-amber-700">
                    {totalFeed > 0 ? `${totalFeed.toFixed(1)} sc` : '—'}
                  </td>
                </tr>
              );
            })()}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
