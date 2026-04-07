'use client';

import { useState } from 'react';
import type { Tank, BercarioLote, RecriaLote, EngordaLote } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Check, X } from 'lucide-react';

interface PhaseEditFormProps {
  tank: Tank;
  bercarioLote?: BercarioLote;
  recriaLote?: RecriaLote;
  engordaLote?: EngordaLote;
  onSave: () => void;
  onCancel: () => void;
}

function Field({
  label,
  value,
  onChange,
  unit,
  step = '0.001',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
        {label} {unit && <span className="text-slate-400 normal-case">({unit})</span>}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-3">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-blue-200" />
    </div>
  );
}

export default function PhaseEditForm({ tank, bercarioLote, recriaLote, engordaLote, onSave, onCancel }: PhaseEditFormProps) {
  const { updateBercarioLote, updateRecriaLote, updateEngordaLote, addBercarioLote, addRecriaLote, addEngordaLote } = useStore();

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
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-blue-700">Editando Lote</span>
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex items-center gap-1 rounded-md border border-blue-600 bg-blue-600 px-2.5 py-1 text-[11px] text-white shadow-sm transition-colors hover:bg-blue-700">
            <Check className="w-3 h-3" /> Salvar
          </button>
          <button onClick={onCancel} className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
            <X className="w-3 h-3" /> Cancelar
          </button>
        </div>
      </div>

      {/* Berçário fields */}
      {tank.phase === 'bercario' && (
        <div className="space-y-2">
          <SectionTitle>Identificação</SectionTitle>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Nome</label>
            <input type="text" value={berc.nome} onChange={(e) => setBerc({ ...berc, nome: e.target.value })}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
          </div>
          <SectionTitle>Produção</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Qtd. Peixes" value={berc.qtd_peixes} onChange={(v) => setBerc({ ...berc, qtd_peixes: v })} step="1" />
            <Field label="Peso Entrada" unit="kg" value={berc.peso_entrada_kg} onChange={(v) => setBerc({ ...berc, peso_entrada_kg: v })} />
            <Field label="Peso a Ganhar" unit="kg" value={berc.peso_ganhar_kg} onChange={(v) => setBerc({ ...berc, peso_ganhar_kg: v })} />
            <Field label="Peso Total" unit="kg" value={berc.peso_total_kg} onChange={(v) => setBerc({ ...berc, peso_total_kg: v })} />
            <Field label="Densidade" unit="kg/m²" value={berc.densidade_kg_m2} onChange={(v) => setBerc({ ...berc, densidade_kg_m2: v })} />
            <Field label="Peso Transf." unit="kg" value={berc.peso_transferencia_kg} onChange={(v) => setBerc({ ...berc, peso_transferencia_kg: v })} />
          </div>
          <SectionTitle>Ração</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ração Período" unit="kg" value={berc.racao_periodo_kg} onChange={(v) => setBerc({ ...berc, racao_periodo_kg: v })} />
            <Field label="Ração Dia" unit="sc" value={berc.racao_dia_sc} onChange={(v) => setBerc({ ...berc, racao_dia_sc: v })} />
            <Field label="Ração Mês" unit="sc" value={berc.racao_mes_sc} onChange={(v) => setBerc({ ...berc, racao_mes_sc: v })} />
            <Field label="Ração Total" unit="sc" value={berc.racao_total_sc} onChange={(v) => setBerc({ ...berc, racao_total_sc: v })} />
          </div>
        </div>
      )}

      {/* Recria fields */}
      {tank.phase === 'recria' && (
        <div className="space-y-2">
          <SectionTitle>Produção</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Qtd. Peixes" value={recr.qtd_peixes} onChange={(v) => setRecr({ ...recr, qtd_peixes: v })} step="1" />
            <Field label="Período" unit="meses" value={recr.periodo_meses} onChange={(v) => setRecr({ ...recr, periodo_meses: v })} step="1" />
            <Field label="Peso Entrada" unit="kg" value={recr.peso_entrada_kg} onChange={(v) => setRecr({ ...recr, peso_entrada_kg: v })} />
            <Field label="Peso a Ganhar" unit="kg" value={recr.peso_ganhar_kg} onChange={(v) => setRecr({ ...recr, peso_ganhar_kg: v })} />
            <Field label="Peso Total" unit="kg" value={recr.peso_total_kg} onChange={(v) => setRecr({ ...recr, peso_total_kg: v })} />
            <Field label="Densidade" unit="kg/m²" value={recr.densidade_kg_m2} onChange={(v) => setRecr({ ...recr, densidade_kg_m2: v })} />
            <Field label="Peso Transf." unit="kg" value={recr.peso_transferencia_kg} onChange={(v) => setRecr({ ...recr, peso_transferencia_kg: v })} />
          </div>
          <SectionTitle>Ração</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ração Período" unit="kg" value={recr.racao_periodo_kg} onChange={(v) => setRecr({ ...recr, racao_periodo_kg: v })} />
            <Field label="Ração Dia" unit="sc" value={recr.racao_dia_sc} onChange={(v) => setRecr({ ...recr, racao_dia_sc: v })} />
            <Field label="Ração Mês" unit="sc" value={recr.racao_mes_sc} onChange={(v) => setRecr({ ...recr, racao_mes_sc: v })} />
            <Field label="Ração Total" unit="sc" value={recr.racao_total_sc} onChange={(v) => setRecr({ ...recr, racao_total_sc: v })} />
          </div>
        </div>
      )}

      {/* Engorda fields */}
      {tank.phase === 'engorda' && (
        <div className="space-y-2">
          <SectionTitle>Identificação</SectionTitle>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Módulo</label>
            <input type="text" value={eng.modulo} onChange={(e) => setEng({ ...eng, modulo: e.target.value })}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
          </div>
          <SectionTitle>Produção</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Qtd. Peixes" value={eng.qtd_peixes} onChange={(v) => setEng({ ...eng, qtd_peixes: v })} step="1" />
            <Field label="Período" unit="meses" value={eng.periodo_meses} onChange={(v) => setEng({ ...eng, periodo_meses: v })} step="1" />
            <Field label="Peso Entrada" unit="kg" value={eng.peso_entrada_kg} onChange={(v) => setEng({ ...eng, peso_entrada_kg: v })} />
            <Field label="Peso a Ganhar" unit="kg" value={eng.peso_ganhar_kg} onChange={(v) => setEng({ ...eng, peso_ganhar_kg: v })} />
            <Field label="P. Final/Peixe" unit="kg" value={eng.peso_final_kg_peixe} onChange={(v) => setEng({ ...eng, peso_final_kg_peixe: v })} />
            <Field label="Conv. Alim." unit="kg/kg" value={eng.conversao_alimentar} onChange={(v) => setEng({ ...eng, conversao_alimentar: v })} />
            <Field label="Peso Total" unit="kg" value={eng.peso_total_kg} onChange={(v) => setEng({ ...eng, peso_total_kg: v })} />
            <Field label="Densidade" unit="kg/m²" value={eng.densidade_kg_m2} onChange={(v) => setEng({ ...eng, densidade_kg_m2: v })} />
          </div>
          <SectionTitle>Ração</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ração Período" unit="kg" value={eng.racao_periodo_kg} onChange={(v) => setEng({ ...eng, racao_periodo_kg: v })} />
            <Field label="Ração Dia" unit="sc" value={eng.racao_dia_sc} onChange={(v) => setEng({ ...eng, racao_dia_sc: v })} />
            <Field label="Ração Mês" unit="sc" value={eng.racao_mes_sc} onChange={(v) => setEng({ ...eng, racao_mes_sc: v })} />
            <Field label="Ração Total" unit="sc" value={eng.racao_total_sc} onChange={(v) => setEng({ ...eng, racao_total_sc: v })} />
          </div>
        </div>
      )}
    </div>
  );
}
