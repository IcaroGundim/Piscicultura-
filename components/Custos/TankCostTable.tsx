'use client';

import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/format';
import SectionCard from './SectionCard';
import { DollarSign } from 'lucide-react';
import { PHASE_LABELS } from '@/lib/types';
import type { TankPhase } from '@/lib/types';

const PHASE_TEXT: Record<Exclude<TankPhase, 'vazio'>, string> = {
  bercario: 'text-[#2d4518] bg-(--phase-bercario)/22 border-(--phase-bercario)/45',
  recria: 'text-(--phase-recria) bg-(--phase-recria)/12 border-(--phase-recria)/28',
  engorda: 'text-blue-900 bg-(--phase-engorda)/12 border-(--phase-engorda)/35',
};

export interface TankCostRow {
  tankId: number;
  subfase?: string;
  phase: Exclude<TankPhase, 'vazio'>;
  biomass: number;
  racaoKg: number;
  custoRacao: number;
  custoMaoObra: number;
  custoOutras: number;
  custoTotal: number;
}

interface TankCostTableProps {
  tanks: TankCostRow[];
}

export default function TankCostTable({ tanks }: TankCostTableProps) {
  if (tanks.length === 0) {
    return (
      <SectionCard title="Detalhamento por Tanque" icon={DollarSign}>
        <p className="text-sm text-muted-foreground py-6 text-center">
          Nenhum tanque ativo no momento.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Detalhamento por Tanque" icon={DollarSign}>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-2">Tanque</th>
              <th className="px-2 py-2">Fase</th>
              <th className="px-2 py-2 text-right">Biomassa</th>
              <th className="px-2 py-2 text-right">Ração</th>
              <th className="px-2 py-2 text-right">Custo Ração</th>
              <th className="px-2 py-2 text-right">Mão de Obra</th>
              <th className="px-2 py-2 text-right">Outros</th>
              <th className="px-2 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {tanks.map((row) => (
              <tr key={row.tankId} className="border-b border-border/60">
                <td className="px-2 py-2 font-semibold whitespace-nowrap">
                  Tanque {row.tankId}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap',
                      PHASE_TEXT[row.phase]
                    )}
                  >
                    {PHASE_LABELS[row.phase]}
                  </span>
                </td>
                <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                  {row.biomass.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
                </td>
                <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                  {row.racaoKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
                </td>
                <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                  {formatBRL(row.custoRacao)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                  {formatBRL(row.custoMaoObra)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">
                  {formatBRL(row.custoOutras)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums font-bold whitespace-nowrap">
                  {formatBRL(row.custoTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
