'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { useStore } from '@/lib/store';
import PhaseBadge from './PhaseBadge';
import PhaseEditForm from './PhaseEditForm';
import { X, Pencil, RefreshCw, Droplets, Scale, Package, Calculator, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TankDetailPanelProps {
  tank: Tank;
  bercarioLote?: BercarioLote;
  recriaLote?: RecriaLote;
  engordaLote?: EngordaLote;
  onClose: () => void;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  highlight?: boolean;
  onDoubleClick?: () => void;
}

interface InlineEditContextValue {
  quickEdit: QuickEditState | null;
  updateQuickEditInputValue: (value: string) => void;
  handleInlineBlur: () => void;
  handleInlineKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const InlineEditContext = createContext<InlineEditContextValue | null>(null);

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color = 'text-blue-700',
  highlight = false,
  onDoubleClick,
}: MetricCardProps) {
  const inlineEditCtx = useContext(InlineEditContext);
  const isInlineEditing = inlineEditCtx?.quickEdit?.label === label;

  return (
    <div className={cn(
      "flex flex-col justify-between rounded-2xl border p-4 shadow-sm shadow-blue-950/5 transition-all duration-200",
      onDoubleClick && !isInlineEditing && 'cursor-pointer hover:-translate-y-0.5 hover:ring-1 hover:ring-blue-200/80',
      highlight ? "border-blue-200/80 bg-blue-50/70" : "border-border bg-card/90"
    )}
      onClick={!isInlineEditing ? onDoubleClick : undefined}
      title={onDoubleClick && !isInlineEditing ? 'Clique para editar este KPI' : undefined}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("rounded-lg p-1.5", highlight ? "bg-blue-100" : "bg-slate-100")}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div>
        {isInlineEditing ? (
          <input
            autoFocus
            type="number"
            step={inlineEditCtx?.quickEdit?.step ?? '0.001'}
            value={inlineEditCtx?.quickEdit?.inputValue ?? ''}
            onChange={(e) => inlineEditCtx?.updateQuickEditInputValue(e.target.value)}
            onBlur={inlineEditCtx?.handleInlineBlur}
            onKeyDown={inlineEditCtx?.handleInlineKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        ) : (
          <p className="text-2xl font-semibold text-slate-800 leading-none">
            {typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : value}
            {unit && <span className="text-sm text-slate-500 font-normal ml-1.5">{unit}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" />
    </div>
  );
}

type EditableMetricField =
  | 'qtd_peixes'
  | 'peso_total_kg'
  | 'densidade_kg_m2'
  | 'peso_entrada_kg'
  | 'peso_transferencia_kg'
  | 'peso_ganhar_kg'
  | 'racao_periodo_kg'
  | 'racao_mes_sc'
  | 'racao_dia_sc'
  | 'racao_total_sc'
  | 'periodo_meses'
  | 'peso_final_kg_peixe'
  | 'conversao_alimentar';

interface QuickEditState {
  fieldKey: EditableMetricField;
  label: string;
  unit?: string;
  step: string;
  integer?: boolean;
  scale?: number;
  inputValue: string;
}

const PHASE_OPTIONS: TankPhase[] = ['bercario', 'recria', 'engorda', 'vazio'];

export default function TankDetailPanel({
  tank,
  bercarioLote,
  recriaLote,
  engordaLote,
  onClose,
}: TankDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPhaseTooltipOpen, setIsPhaseTooltipOpen] = useState(false);
  const [phaseSubfaseDraft, setPhaseSubfaseDraft] = useState(tank.subfase ?? '');
  const [quickEdit, setQuickEdit] = useState<QuickEditState | null>(null);
  const skipBlurCommitRef = useRef(false);
  const phaseTooltipRef = useRef<HTMLDivElement | null>(null);

  const {
    updateTankPhase,
    updateBercarioLote,
    updateRecriaLote,
    updateEngordaLote,
    addBercarioLote,
    addRecriaLote,
    addEngordaLote,
  } = useStore();

  // ── Ordered editable fields per phase (matches visual layout) ──
  interface FieldDef {
    fieldKey: EditableMetricField;
    label: string;
    value: number;
    unit?: string;
    step?: string;
    integer?: boolean;
    scale?: number;
  }

  const editableFields: FieldDef[] = useMemo(() => {
    if (tank.phase === 'bercario' && bercarioLote) {
      return [
        { fieldKey: 'qtd_peixes', label: 'Qtd. Peixes', value: bercarioLote.qtd_peixes, step: '1', integer: true },
        { fieldKey: 'peso_total_kg', label: 'Biomassa Total', value: bercarioLote.peso_total_kg, unit: 'kg' },
        { fieldKey: 'densidade_kg_m2', label: 'Densidade alvo', value: bercarioLote.densidade_kg_m2, unit: 'kg/m²' },
        { fieldKey: 'peso_entrada_kg', label: 'Peso Entrada (un)', value: bercarioLote.peso_entrada_kg, unit: 'g', scale: 1000 },
        { fieldKey: 'peso_transferencia_kg', label: 'Peso Transf. (un)', value: bercarioLote.peso_transferencia_kg, unit: 'g', scale: 1000 },
        { fieldKey: 'peso_ganhar_kg', label: 'Peso a Ganhar', value: bercarioLote.peso_ganhar_kg, unit: 'kg' },
        { fieldKey: 'racao_periodo_kg', label: 'Total do Período', value: bercarioLote.racao_periodo_kg, unit: 'kg' },
        { fieldKey: 'racao_mes_sc', label: 'Consumo Mensal', value: bercarioLote.racao_mes_sc, unit: 'sacos' },
        { fieldKey: 'racao_dia_sc', label: 'Consumo Diário', value: bercarioLote.racao_dia_sc, unit: 'sacos' },
        { fieldKey: 'racao_total_sc', label: 'Total Geral', value: bercarioLote.racao_total_sc, unit: 'sacos' },
      ];
    }
    if (tank.phase === 'recria' && recriaLote) {
      return [
        { fieldKey: 'periodo_meses', label: 'Período (meses)', value: recriaLote.periodo_meses, unit: 'meses', step: '1', integer: true },
        { fieldKey: 'qtd_peixes', label: 'Qtd. Peixes', value: recriaLote.qtd_peixes, step: '1', integer: true },
        { fieldKey: 'peso_total_kg', label: 'Biomassa Total', value: recriaLote.peso_total_kg, unit: 'kg' },
        { fieldKey: 'densidade_kg_m2', label: 'Densidade alvo', value: recriaLote.densidade_kg_m2, unit: 'kg/m²' },
        { fieldKey: 'peso_entrada_kg', label: 'Peso Entrada (un)', value: recriaLote.peso_entrada_kg, unit: 'kg' },
        { fieldKey: 'peso_transferencia_kg', label: 'Peso Transf. (un)', value: recriaLote.peso_transferencia_kg, unit: 'kg' },
        { fieldKey: 'peso_ganhar_kg', label: 'Peso a Ganhar', value: recriaLote.peso_ganhar_kg, unit: 'kg' },
        { fieldKey: 'racao_periodo_kg', label: 'Total do Período', value: recriaLote.racao_periodo_kg, unit: 'kg' },
        { fieldKey: 'racao_mes_sc', label: 'Consumo Mensal', value: recriaLote.racao_mes_sc, unit: 'sacos' },
        { fieldKey: 'racao_dia_sc', label: 'Consumo Diário', value: recriaLote.racao_dia_sc, unit: 'sacos' },
        { fieldKey: 'racao_total_sc', label: 'Total Geral', value: recriaLote.racao_total_sc, unit: 'sacos' },
      ];
    }
    if (tank.phase === 'engorda' && engordaLote) {
      return [
        { fieldKey: 'periodo_meses', label: 'Período (meses)', value: engordaLote.periodo_meses, unit: 'meses', step: '1', integer: true },
        { fieldKey: 'qtd_peixes', label: 'Qtd. Peixes', value: engordaLote.qtd_peixes, step: '1', integer: true },
        { fieldKey: 'peso_total_kg', label: 'Biomassa Total', value: engordaLote.peso_total_kg, unit: 'kg' },
        { fieldKey: 'densidade_kg_m2', label: 'Densidade final', value: engordaLote.densidade_kg_m2, unit: 'kg/m²' },
        { fieldKey: 'peso_entrada_kg', label: 'Peso Entrada (un)', value: engordaLote.peso_entrada_kg, unit: 'kg' },
        { fieldKey: 'peso_final_kg_peixe', label: 'Peso Abate (un)', value: engordaLote.peso_final_kg_peixe, unit: 'kg' },
        { fieldKey: 'peso_ganhar_kg', label: 'Peso a Ganhar', value: engordaLote.peso_ganhar_kg, unit: 'kg' },
        { fieldKey: 'racao_periodo_kg', label: 'Ração Total Período', value: engordaLote.racao_periodo_kg, unit: 'kg' },
        { fieldKey: 'racao_mes_sc', label: 'Consumo Mensal', value: engordaLote.racao_mes_sc, unit: 'sacos' },
        { fieldKey: 'racao_total_sc', label: 'Total Sacos', value: engordaLote.racao_total_sc, unit: 'sacos' },
        { fieldKey: 'conversao_alimentar', label: 'Conv. Alimentar (FCA)', value: engordaLote.conversao_alimentar, unit: 'x' },
      ];
    }
    return [];
  }, [tank.phase, bercarioLote, recriaLote, engordaLote]);

  const handleInitializeLote = () => {
    if (tank.phase === 'bercario' && !bercarioLote) {
      addBercarioLote({
        tankId: tank.id, nome: '', qtd_peixes: 0, peso_entrada_kg: 0, peso_ganhar_kg: 0,
        racao_periodo_kg: 0, peso_total_kg: 0, densidade_kg_m2: 0,
        peso_transferencia_kg: 0.1, racao_dia_sc: 0, racao_mes_sc: 0, racao_total_sc: 0,
      });
    } else if (tank.phase === 'recria' && !recriaLote) {
      addRecriaLote({
        tankId: tank.id, qtd_peixes: 0, peso_entrada_kg: 0, peso_ganhar_kg: 0,
        racao_periodo_kg: 0, peso_total_kg: 0, densidade_kg_m2: 0,
        peso_transferencia_kg: 0.7, racao_dia_sc: 0, racao_mes_sc: 0,
        racao_total_sc: 0, periodo_meses: 5,
      });
    } else if (tank.phase === 'engorda' && !engordaLote) {
      addEngordaLote({
        tankId: tank.id, modulo: '', qtd_peixes: 0, peso_entrada_kg: 0, peso_ganhar_kg: 0,
        racao_periodo_kg: 0, conversao_alimentar: 2, peso_final_kg_peixe: 2.5,
        peso_total_kg: 0, densidade_kg_m2: 0, racao_dia_sc: 0,
        racao_mes_sc: 0, racao_total_sc: 0, periodo_meses: 5,
      });
    }
  };

  const openQuickEdit = ({
    fieldKey,
    label,
    value,
    unit,
    step = '0.001',
    integer = false,
    scale = 1,
  }: {
    fieldKey: EditableMetricField;
    label: string;
    value: number;
    unit?: string;
    step?: string;
    integer?: boolean;
    scale?: number;
  }) => {
    if (isEditing) {
      return;
    }

    setQuickEdit({
      fieldKey,
      label,
      unit,
      step,
      integer,
      scale,
      inputValue: (value * scale).toString(),
    });
  };

  const updateQuickEditInputValue = (value: string) => {
    setQuickEdit((prev) => (prev ? { ...prev, inputValue: value } : prev));
  };

  const handleQuickEditSave = () => {
    if (!quickEdit) {
      return true;
    }

    const parsed = Number(quickEdit.inputValue.replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      setQuickEdit(null);
      return false;
    }

    const normalizedValue = quickEdit.integer ? Math.round(parsed) : parsed;
    const storedValue = normalizedValue / (quickEdit.scale ?? 1);
    const patch = { [quickEdit.fieldKey]: storedValue } as any;

    if (tank.phase === 'bercario') {
      updateBercarioLote(tank.id, patch);
    } else if (tank.phase === 'recria') {
      updateRecriaLote(tank.id, patch);
    } else if (tank.phase === 'engorda') {
      updateEngordaLote(tank.id, patch);
    }

    setQuickEdit(null);
    return true;
  };

  const handleInlineKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      skipBlurCommitRef.current = true;
      setQuickEdit(null);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleQuickEditSave();
      return;
    }

    // Tab / Shift+Tab → save current and jump to next/previous field
    if (event.key === 'Tab' && editableFields.length > 0 && quickEdit) {
      event.preventDefault();
      skipBlurCommitRef.current = true; // prevent blur from double-saving

      const saved = handleQuickEditSave();
      if (!saved) return;

      const currentIdx = editableFields.findIndex((f) => f.fieldKey === quickEdit.fieldKey);
      if (currentIdx === -1) return;

      const nextIdx = event.shiftKey
        ? (currentIdx - 1 + editableFields.length) % editableFields.length
        : (currentIdx + 1) % editableFields.length;

      const next = editableFields[nextIdx];
      const scale = next.scale ?? 1;

      setQuickEdit({
        fieldKey: next.fieldKey,
        label: next.label,
        unit: next.unit,
        step: next.step ?? '0.001',
        integer: next.integer,
        scale: next.scale,
        inputValue: (next.value * scale).toString(),
      });
    }
  };

  const handleInlineBlur = () => {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }

    handleQuickEditSave();
  };

  useEffect(() => {
    setPhaseSubfaseDraft(tank.subfase ?? '');
  }, [tank.id, tank.subfase]);

  useEffect(() => {
    if (!isPhaseTooltipOpen) {
      return;
    }

    const handleOutsideMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (phaseTooltipRef.current && !phaseTooltipRef.current.contains(target)) {
        setIsPhaseTooltipOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPhaseTooltipOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideMouseDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPhaseTooltipOpen]);

  const applyPhaseChange = (nextPhase: TankPhase) => {
    handleQuickEditSave();
    updateTankPhase(tank.id, nextPhase, phaseSubfaseDraft.trim() || undefined);
    setIsPhaseTooltipOpen(false);
  };

  const applySubfaseOnly = () => {
    handleQuickEditSave();
    updateTankPhase(tank.id, tank.phase, phaseSubfaseDraft.trim() || undefined);
    setIsPhaseTooltipOpen(false);
  };

  const hasLoteActive = (tank.phase === 'bercario' && bercarioLote) ||
    (tank.phase === 'recria' && recriaLote) ||
    (tank.phase === 'engorda' && engordaLote);

  const inlineEditContextValue: InlineEditContextValue = {
    quickEdit,
    updateQuickEditInputValue,
    handleInlineBlur,
    handleInlineKeyDown,
  };

  return (
    <InlineEditContext.Provider value={inlineEditContextValue}>
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/80 bg-slate-50/85 px-6 py-5 backdrop-blur-sm relative z-20">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-800 leading-none" style={{ fontFamily: 'var(--font-syne)' }}>
                Tanque {tank.id.toString().padStart(2, '0')}
              </h2>

              <div className="relative" ref={phaseTooltipRef}>
                <button
                  onClick={() => {
                    handleQuickEditSave();
                    setPhaseSubfaseDraft(tank.subfase ?? '');
                    setIsPhaseTooltipOpen((prev) => !prev);
                  }}
                  className="group relative cursor-pointer outline-none transition-transform active:scale-95 flex items-center"
                  title="Clique para mudar a fase do tanque"
                  aria-expanded={isPhaseTooltipOpen}
                  aria-haspopup="dialog"
                >
                  <PhaseBadge phase={tank.phase} size="md" className="group-hover:ring-2 group-hover:ring-blue-300/60 group-hover:ring-offset-1 transition-all" />
                </button>

                {isPhaseTooltipOpen && (
                  <div className="absolute left-0 top-10 z-30 w-[290px] rounded-xl border border-blue-200/80 bg-white/95 p-3 shadow-lg shadow-blue-950/10 backdrop-blur-sm">
                    <div className="mb-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Alterar tipo de tanque</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">A fase selecionada é aplicada imediatamente.</p>
                    </div>

                    <label className="mb-1 block text-[11px] text-slate-500 uppercase tracking-wider">
                      Subfase / Módulo <span className="text-slate-400 lowercase normal-case">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={phaseSubfaseDraft}
                      onChange={(e) => setPhaseSubfaseDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applySubfaseOnly();
                        }
                      }}
                      placeholder="ex: Módulo 1..."
                      className="mb-3 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {PHASE_OPTIONS.map((phaseOption) => (
                        <button
                          key={phaseOption}
                          type="button"
                          onClick={() => applyPhaseChange(phaseOption)}
                          className={cn(
                            'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                            tank.phase === phaseOption
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
                          )}
                        >
                          {PHASE_LABELS[phaseOption]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              {tank.subfase && (
                <>
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {tank.subfase}
                  </span>
                  <span className="text-slate-300">•</span>
                </>
              )}
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-600/70" />
                {tank.area_m2.toLocaleString('pt-BR')} m² ({tank.area_ha} ha)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleQuickEditSave();
                setIsPhaseTooltipOpen(false);
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar relative">
          {isEditing ? (
            <div className="w-full h-full min-h-[400px] rounded-2xl border border-border bg-card p-6 shadow-md shadow-blue-950/5 flex flex-col">
              <h3 className="text-lg font-medium text-slate-800 mb-6">Editar Lote de {PHASE_LABELS[tank.phase]}</h3>
              <PhaseEditForm
                tank={tank}
                bercarioLote={bercarioLote}
                recriaLote={recriaLote}
                engordaLote={engordaLote}
                onSave={() => setIsEditing(false)}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : !hasLoteActive && tank.phase !== 'vazio' ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-12 text-center">
              <Package className="w-10 h-10 text-slate-400 mb-3" />
              <h3 className="text-base font-medium text-slate-700 mb-2">Sem lote cadastrado</h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                Este tanque está definido como <strong>{PHASE_LABELS[tank.phase]}</strong>, mas nenhum lote foi inicializado para preencher as projeções.
              </p>
              <button
                onClick={handleInitializeLote}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-900/30 transition-all hover:scale-105 hover:bg-blue-500"
              >
                <Pencil className="w-4 h-4" />
                Inicializar Lote
              </button>
            </div>
          ) : tank.phase === 'vazio' ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-12 text-center">
              <Droplets className="w-10 h-10 text-slate-400 mb-3" />
              <h3 className="text-base font-medium text-slate-700 mb-2">Tanque Vazio</h3>
              <p className="text-sm text-slate-500">Mude a fase do tanque para designar um novo lote de produção e calcular as projeções de crescimento.</p>
            </div>
          ) : (
            <div className="space-y-8 pb-12">
              {/* --- BERCÁRIO --- */}
              {tank.phase === 'bercario' && bercarioLote && (
                <>
                  <div>
                    <SectionTitle>Capacidade & Produção Projetada</SectionTitle>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      <MetricCard
                        icon={Package}
                        label="Qtd. Peixes"
                        value={bercarioLote.qtd_peixes}
                        highlight
                        color="text-blue-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'qtd_peixes', label: 'Qtd. Peixes', value: bercarioLote.qtd_peixes, step: '1', integer: true })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Biomassa Total"
                        value={bercarioLote.peso_total_kg}
                        unit="kg"
                        highlight
                        color="text-blue-700"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_total_kg', label: 'Biomassa Total', value: bercarioLote.peso_total_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Droplets}
                        label="Densidade alvo"
                        value={bercarioLote.densidade_kg_m2}
                        unit="kg/m²"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'densidade_kg_m2', label: 'Densidade alvo', value: bercarioLote.densidade_kg_m2, unit: 'kg/m²' })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso Entrada (un)"
                        value={bercarioLote.peso_entrada_kg * 1000}
                        unit="g"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_entrada_kg', label: 'Peso Entrada (un)', value: bercarioLote.peso_entrada_kg, unit: 'g', scale: 1000 })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso Transf. (un)"
                        value={bercarioLote.peso_transferencia_kg * 1000}
                        unit="g"
                        color="text-blue-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_transferencia_kg', label: 'Peso Transf. (un)', value: bercarioLote.peso_transferencia_kg, unit: 'g', scale: 1000 })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso a Ganhar"
                        value={bercarioLote.peso_ganhar_kg}
                        unit="kg"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_ganhar_kg', label: 'Peso a Ganhar', value: bercarioLote.peso_ganhar_kg, unit: 'kg' })}
                      />
                    </div>
                  </div>

                  <div>
                    <SectionTitle>Manejo Alimentar (Projeção)</SectionTitle>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      <MetricCard
                        icon={Calculator}
                        label="Total do Período"
                        value={bercarioLote.racao_periodo_kg}
                        unit="kg"
                        highlight
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_periodo_kg', label: 'Total do Período', value: bercarioLote.racao_periodo_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Calculator}
                        label="Consumo Mensal"
                        value={bercarioLote.racao_mes_sc}
                        unit="sacos"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_mes_sc', label: 'Consumo Mensal', value: bercarioLote.racao_mes_sc, unit: 'sacos' })}
                      />
                      <MetricCard
                        icon={Calculator}
                        label="Consumo Diário"
                        value={bercarioLote.racao_dia_sc}
                        unit="sacos"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_dia_sc', label: 'Consumo Diário', value: bercarioLote.racao_dia_sc, unit: 'sacos' })}
                      />
                      <MetricCard
                        icon={Calculator}
                        label="Total Geral"
                        value={bercarioLote.racao_total_sc}
                        unit="sacos"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_total_sc', label: 'Total Geral', value: bercarioLote.racao_total_sc, unit: 'sacos' })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* --- RECRIA --- */}
              {tank.phase === 'recria' && recriaLote && (
                <>
                  <div>
                    <div className="flex items-end justify-between mb-4 mt-8 first:mt-0">
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Capacidade & Produção Projetada</span>
                        <div className="w-full h-px bg-gradient-to-r from-blue-200 to-transparent" />
                      </div>
                      {quickEdit?.fieldKey === 'periodo_meses' ? (
                        <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-blue-600/70" />
                          <input
                            autoFocus
                            type="number"
                            step="1"
                            value={quickEdit.inputValue}
                            onChange={(e) => updateQuickEditInputValue(e.target.value)}
                            onBlur={handleInlineBlur}
                            onKeyDown={handleInlineKeyDown}
                            className="w-12 bg-transparent text-xs font-medium text-slate-700 outline-none"
                          />
                          meses
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                          title="Clique para editar período"
                          onClick={() => openQuickEdit({ fieldKey: 'periodo_meses', label: 'Período (meses)', value: recriaLote.periodo_meses, unit: 'meses', step: '1', integer: true })}
                        >
                          <Clock className="w-3.5 h-3.5 text-blue-600/70" />
                          {recriaLote.periodo_meses} meses
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      <MetricCard
                        icon={Package}
                        label="Qtd. Peixes"
                        value={recriaLote.qtd_peixes}
                        highlight
                        color="text-green-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'qtd_peixes', label: 'Qtd. Peixes', value: recriaLote.qtd_peixes, step: '1', integer: true })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Biomassa Total"
                        value={recriaLote.peso_total_kg}
                        unit="kg"
                        highlight
                        color="text-blue-700"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_total_kg', label: 'Biomassa Total', value: recriaLote.peso_total_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Droplets}
                        label="Densidade alvo"
                        value={recriaLote.densidade_kg_m2}
                        unit="kg/m²"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'densidade_kg_m2', label: 'Densidade alvo', value: recriaLote.densidade_kg_m2, unit: 'kg/m²' })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso Entrada (un)"
                        value={recriaLote.peso_entrada_kg}
                        unit="kg"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_entrada_kg', label: 'Peso Entrada (un)', value: recriaLote.peso_entrada_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso Transf. (un)"
                        value={recriaLote.peso_transferencia_kg}
                        unit="kg"
                        color="text-green-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_transferencia_kg', label: 'Peso Transf. (un)', value: recriaLote.peso_transferencia_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso a Ganhar"
                        value={recriaLote.peso_ganhar_kg}
                        unit="kg"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_ganhar_kg', label: 'Peso a Ganhar', value: recriaLote.peso_ganhar_kg, unit: 'kg' })}
                      />
                    </div>
                  </div>

                  <div>
                    <SectionTitle>Manejo Alimentar (Projeção)</SectionTitle>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      <MetricCard
                        icon={Calculator}
                        label="Total do Período"
                        value={recriaLote.racao_periodo_kg}
                        unit="kg"
                        highlight
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_periodo_kg', label: 'Total do Período', value: recriaLote.racao_periodo_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Calculator}
                        label="Consumo Mensal"
                        value={recriaLote.racao_mes_sc}
                        unit="sacos"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_mes_sc', label: 'Consumo Mensal', value: recriaLote.racao_mes_sc, unit: 'sacos' })}
                      />
                      <MetricCard
                        icon={Calculator}
                        label="Consumo Diário"
                        value={recriaLote.racao_dia_sc}
                        unit="sacos"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_dia_sc', label: 'Consumo Diário', value: recriaLote.racao_dia_sc, unit: 'sacos' })}
                      />
                      <MetricCard
                        icon={Calculator}
                        label="Total Geral"
                        value={recriaLote.racao_total_sc}
                        unit="sacos"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_total_sc', label: 'Total Geral', value: recriaLote.racao_total_sc, unit: 'sacos' })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* --- ENGORDA --- */}
              {tank.phase === 'engorda' && engordaLote && (
                <>
                  <div>
                    <div className="flex items-end justify-between mb-4 mt-8 first:mt-0">
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Capacidade & Produção Final</span>
                        <div className="w-full h-px bg-gradient-to-r from-blue-200 to-transparent" />
                      </div>
                      {quickEdit?.fieldKey === 'periodo_meses' ? (
                        <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-blue-600/70" />
                          <input
                            autoFocus
                            type="number"
                            step="1"
                            value={quickEdit.inputValue}
                            onChange={(e) => updateQuickEditInputValue(e.target.value)}
                            onBlur={handleInlineBlur}
                            onKeyDown={handleInlineKeyDown}
                            className="w-12 bg-transparent text-xs font-medium text-slate-700 outline-none"
                          />
                          meses
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                          title="Clique para editar período"
                          onClick={() => openQuickEdit({ fieldKey: 'periodo_meses', label: 'Período (meses)', value: engordaLote.periodo_meses, unit: 'meses', step: '1', integer: true })}
                        >
                          <Clock className="w-3.5 h-3.5 text-blue-600/70" />
                          {engordaLote.periodo_meses} meses
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      <MetricCard
                        icon={Package}
                        label="Qtd. Peixes"
                        value={engordaLote.qtd_peixes}
                        highlight
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'qtd_peixes', label: 'Qtd. Peixes', value: engordaLote.qtd_peixes, step: '1', integer: true })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Biomassa Total"
                        value={engordaLote.peso_total_kg}
                        unit="kg"
                        highlight
                        color="text-blue-700"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_total_kg', label: 'Biomassa Total', value: engordaLote.peso_total_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Droplets}
                        label="Densidade final"
                        value={engordaLote.densidade_kg_m2}
                        unit="kg/m²"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'densidade_kg_m2', label: 'Densidade final', value: engordaLote.densidade_kg_m2, unit: 'kg/m²' })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso Entrada (un)"
                        value={engordaLote.peso_entrada_kg}
                        unit="kg"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_entrada_kg', label: 'Peso Entrada (un)', value: engordaLote.peso_entrada_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso Abate (un)"
                        value={engordaLote.peso_final_kg_peixe}
                        unit="kg"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_final_kg_peixe', label: 'Peso Abate (un)', value: engordaLote.peso_final_kg_peixe, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Scale}
                        label="Peso a Ganhar"
                        value={engordaLote.peso_ganhar_kg}
                        unit="kg"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'peso_ganhar_kg', label: 'Peso a Ganhar', value: engordaLote.peso_ganhar_kg, unit: 'kg' })}
                      />
                    </div>
                  </div>

                  <div>
                    <SectionTitle>Manejo Alimentar (Projeção)</SectionTitle>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      <MetricCard
                        icon={Calculator}
                        label="Ração Total Período"
                        value={engordaLote.racao_periodo_kg}
                        unit="kg"
                        highlight
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_periodo_kg', label: 'Ração Total Período', value: engordaLote.racao_periodo_kg, unit: 'kg' })}
                      />
                      <MetricCard
                        icon={Calculator}
                        label="Consumo Mensal"
                        value={engordaLote.racao_mes_sc}
                        unit="sacos"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_mes_sc', label: 'Consumo Mensal', value: engordaLote.racao_mes_sc, unit: 'sacos' })}
                      />
                      <MetricCard
                        icon={Calculator}
                        label="Total Sacos"
                        value={engordaLote.racao_total_sc}
                        unit="sacos"
                        color="text-amber-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'racao_total_sc', label: 'Total Sacos', value: engordaLote.racao_total_sc, unit: 'sacos' })}
                      />
                      <MetricCard
                        icon={RefreshCw}
                        label="Conv. Alimentar (FCA)"
                        value={engordaLote.conversao_alimentar}
                        unit="x"
                        color="text-indigo-600"
                        onDoubleClick={() => openQuickEdit({ fieldKey: 'conversao_alimentar', label: 'Conv. Alimentar (FCA)', value: engordaLote.conversao_alimentar, unit: 'x' })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isEditing && hasLoteActive && tank.phase !== 'vazio' && (
          <div className="absolute bottom-6 right-6">
            <button
              onClick={() => {
                handleQuickEditSave();
                setIsEditing(true);
              }}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-900/30 transition-all hover:scale-105 hover:bg-blue-500"
            >
              <Pencil className="w-4 h-4" />
              Editar Projeções
            </button>
          </div>
        )}
      </div>
    </InlineEditContext.Provider>
  );
}
