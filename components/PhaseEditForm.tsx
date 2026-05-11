'use client';

import { useState } from 'react';
import type { Tank, BercarioLote, RecriaLote, EngordaLote } from '@/lib/types';
import { useStore } from '@/lib/store';
import { NumberField } from '@/components/forms/NumberField';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/SectionTitle';
import { Check, X } from 'lucide-react';

interface PhaseEditFormProps {
  tank: Tank;
  bercarioLote?: BercarioLote;
  recriaLote?: RecriaLote;
  engordaLote?: EngordaLote;
  onSave: () => void;
  onCancel: () => void;
}

export default function PhaseEditForm({ tank, bercarioLote, recriaLote, engordaLote, onSave, onCancel }: PhaseEditFormProps) {
  const updateBercarioLote = useStore((s) => s.updateBercarioLote);
  const updateRecriaLote = useStore((s) => s.updateRecriaLote);
  const updateEngordaLote = useStore((s) => s.updateEngordaLote);
  const addBercarioLote = useStore((s) => s.addBercarioLote);
  const addRecriaLote = useStore((s) => s.addRecriaLote);
  const addEngordaLote = useStore((s) => s.addEngordaLote);

  // Berçário state
  const [berc, setBerc] = useState<BercarioLote>(
    bercarioLote ?? {
      tankId: tank.id, nome: '', qtd_peixes: 0, peso_entrada_kg: 0, peso_ganhar_kg: 0,
      racao_periodo_kg: 0, peso_total_kg: 0, densidade_kg_m2: 0,
      peso_transferencia_kg: 0.1, racao_dia_sc: 0, racao_mes_sc: 0, racao_total_sc: 0,
    }
  );

  // Recria state
  const [recr, setRecr] = useState<RecriaLote>(
    recriaLote ?? {
      tankId: tank.id, qtd_peixes: 0, peso_entrada_kg: 0, peso_ganhar_kg: 0,
      racao_periodo_kg: 0, peso_total_kg: 0, densidade_kg_m2: 0,
      peso_transferencia_kg: 0.7, racao_dia_sc: 0, racao_mes_sc: 0,
      racao_total_sc: 0, periodo_meses: 5,
    }
  );

  // Engorda state
  const [eng, setEng] = useState<EngordaLote>(
    engordaLote ?? {
      tankId: tank.id, modulo: '', qtd_peixes: 0, peso_entrada_kg: 0, peso_ganhar_kg: 0,
      racao_periodo_kg: 0, conversao_alimentar: 2, peso_final_kg_peixe: 2.5,
      peso_total_kg: 0, densidade_kg_m2: 0, racao_dia_sc: 0,
      racao_mes_sc: 0, racao_total_sc: 0, periodo_meses: 5,
    }
  );

  const handleSave = () => {
    if (tank.phase === 'bercario') {
      if (bercarioLote) updateBercarioLote(tank.id, berc);
      else addBercarioLote(berc);
    } else if (tank.phase === 'recria') {
      if (recriaLote) updateRecriaLote(tank.id, recr);
      else addRecriaLote(recr);
    } else if (tank.phase === 'engorda') {
      if (engordaLote) updateEngordaLote(tank.id, eng);
      else addEngordaLote(eng);
    }
    onSave();
  };

  return (
    <div className="mt-2 flex flex-col h-full">
      <div className="mb-4">
        <span className="text-xs font-semibold text-primary">Editando Lote</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Berçário fields */}
        {tank.phase === 'bercario' && (
          <div className="space-y-3">
            <SectionTitle>Identificação</SectionTitle>
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Nome
              </label>
              <input
                type="text"
                value={berc.nome}
                onChange={(e) => setBerc({ ...berc, nome: e.target.value })}
                className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              />
            </div>
            <SectionTitle>Produção</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Qtd. Peixes" value={berc.qtd_peixes} onChange={(v) => setBerc({ ...berc, qtd_peixes: v })} step="1" />
              <NumberField label="Peso Entrada" unit="kg" value={berc.peso_entrada_kg} onChange={(v) => setBerc({ ...berc, peso_entrada_kg: v })} />
              <NumberField label="Peso a Ganhar" unit="kg" value={berc.peso_ganhar_kg} onChange={(v) => setBerc({ ...berc, peso_ganhar_kg: v })} />
              <NumberField label="Peso Total" unit="kg" value={berc.peso_total_kg} onChange={(v) => setBerc({ ...berc, peso_total_kg: v })} />
              <NumberField label="Densidade" unit="kg/m²" value={berc.densidade_kg_m2} onChange={(v) => setBerc({ ...berc, densidade_kg_m2: v })} />
              <NumberField label="Peso Transf." unit="kg" value={berc.peso_transferencia_kg} onChange={(v) => setBerc({ ...berc, peso_transferencia_kg: v })} />
            </div>
            <SectionTitle>Ração</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Ração Período" unit="kg" value={berc.racao_periodo_kg} onChange={(v) => setBerc({ ...berc, racao_periodo_kg: v })} />
              <NumberField label="Ração Dia" unit="sc" value={berc.racao_dia_sc} onChange={(v) => setBerc({ ...berc, racao_dia_sc: v })} />
              <NumberField label="Ração Mês" unit="sc" value={berc.racao_mes_sc} onChange={(v) => setBerc({ ...berc, racao_mes_sc: v })} />
              <NumberField label="Ração Total" unit="sc" value={berc.racao_total_sc} onChange={(v) => setBerc({ ...berc, racao_total_sc: v })} />
            </div>
          </div>
        )}

        {/* Recria fields */}
        {tank.phase === 'recria' && (
          <div className="space-y-3">
            <SectionTitle>Produção</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Qtd. Peixes" value={recr.qtd_peixes} onChange={(v) => setRecr({ ...recr, qtd_peixes: v })} step="1" />
              <NumberField label="Período" unit="meses" value={recr.periodo_meses} onChange={(v) => setRecr({ ...recr, periodo_meses: v })} step="1" />
              <NumberField label="Peso Entrada" unit="kg" value={recr.peso_entrada_kg} onChange={(v) => setRecr({ ...recr, peso_entrada_kg: v })} />
              <NumberField label="Peso a Ganhar" unit="kg" value={recr.peso_ganhar_kg} onChange={(v) => setRecr({ ...recr, peso_ganhar_kg: v })} />
              <NumberField label="Peso Total" unit="kg" value={recr.peso_total_kg} onChange={(v) => setRecr({ ...recr, peso_total_kg: v })} />
              <NumberField label="Densidade" unit="kg/m²" value={recr.densidade_kg_m2} onChange={(v) => setRecr({ ...recr, densidade_kg_m2: v })} />
              <NumberField label="Peso Transf." unit="kg" value={recr.peso_transferencia_kg} onChange={(v) => setRecr({ ...recr, peso_transferencia_kg: v })} />
            </div>
            <SectionTitle>Ração</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Ração Período" unit="kg" value={recr.racao_periodo_kg} onChange={(v) => setRecr({ ...recr, racao_periodo_kg: v })} />
              <NumberField label="Ração Dia" unit="sc" value={recr.racao_dia_sc} onChange={(v) => setRecr({ ...recr, racao_dia_sc: v })} />
              <NumberField label="Ração Mês" unit="sc" value={recr.racao_mes_sc} onChange={(v) => setRecr({ ...recr, racao_mes_sc: v })} />
              <NumberField label="Ração Total" unit="sc" value={recr.racao_total_sc} onChange={(v) => setRecr({ ...recr, racao_total_sc: v })} />
            </div>
          </div>
        )}

        {/* Engorda fields */}
        {tank.phase === 'engorda' && (
          <div className="space-y-3">
            <SectionTitle>Identificação</SectionTitle>
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Módulo
              </label>
              <input
                type="text"
                value={eng.modulo}
                onChange={(e) => setEng({ ...eng, modulo: e.target.value })}
                className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              />
            </div>
            <SectionTitle>Produção</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Qtd. Peixes" value={eng.qtd_peixes} onChange={(v) => setEng({ ...eng, qtd_peixes: v })} step="1" />
              <NumberField label="Período" unit="meses" value={eng.periodo_meses} onChange={(v) => setEng({ ...eng, periodo_meses: v })} step="1" />
              <NumberField label="Peso Entrada" unit="kg" value={eng.peso_entrada_kg} onChange={(v) => setEng({ ...eng, peso_entrada_kg: v })} />
              <NumberField label="Peso a Ganhar" unit="kg" value={eng.peso_ganhar_kg} onChange={(v) => setEng({ ...eng, peso_ganhar_kg: v })} />
              <NumberField label="P. Final/Peixe" unit="kg" value={eng.peso_final_kg_peixe} onChange={(v) => setEng({ ...eng, peso_final_kg_peixe: v })} />
              <NumberField label="Conv. Alim." unit="kg/kg" value={eng.conversao_alimentar} onChange={(v) => setEng({ ...eng, conversao_alimentar: v })} />
              <NumberField label="Peso Total" unit="kg" value={eng.peso_total_kg} onChange={(v) => setEng({ ...eng, peso_total_kg: v })} />
              <NumberField label="Densidade" unit="kg/m²" value={eng.densidade_kg_m2} onChange={(v) => setEng({ ...eng, densidade_kg_m2: v })} />
            </div>
            <SectionTitle>Ração</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Ração Período" unit="kg" value={eng.racao_periodo_kg} onChange={(v) => setEng({ ...eng, racao_periodo_kg: v })} />
              <NumberField label="Ração Dia" unit="sc" value={eng.racao_dia_sc} onChange={(v) => setEng({ ...eng, racao_dia_sc: v })} />
              <NumberField label="Ração Mês" unit="sc" value={eng.racao_mes_sc} onChange={(v) => setEng({ ...eng, racao_mes_sc: v })} />
              <NumberField label="Ração Total" unit="sc" value={eng.racao_total_sc} onChange={(v) => setEng({ ...eng, racao_total_sc: v })} />
            </div>
          </div>
        )}
      </div>

      {/* Footer sticky */}
      <div className="sticky bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 z-10 -mx-4">
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} className="min-h-[40px]">
            <X className="w-4 h-4" /> Cancelar
          </Button>
          <Button variant="default" onClick={handleSave} className="min-h-[40px]">
            <Check className="w-4 h-4" /> Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
