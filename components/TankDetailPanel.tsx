'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { useStore } from '@/lib/store';
import PhaseBadge from './PhaseBadge';
import { X, Pencil, RefreshCw, Droplets, Scale, Package, Calculator, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPhaseDotColor } from '@/lib/phase-utils';
import { MetricCard } from './MetricCard';
import { SectionTitle } from './SectionTitle';
import { Skeleton } from './ui/skeleton';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

interface TankDetailPanelProps {
  tank: Tank;
  bercarioLote?: BercarioLote;
  recriaLote?: RecriaLote;
  engordaLote?: EngordaLote;
  onClose: () => void;
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

interface FieldDef {
  key: EditableMetricField;
  label: string;
  icon: React.ElementType;
  color?: string;
  highlight?: boolean;
  unit?: string;
  step?: string;
  integer?: boolean;
  scale?: number;
  section: 'capacity' | 'feeding';
  hidden?: boolean;
}

const PHASE_OPTIONS: TankPhase[] = ['bercario', 'recria', 'engorda', 'vazio'];

const PHASE_FIELDS: Record<Exclude<TankPhase, 'vazio'>, FieldDef[]> = {
  bercario: [
    { key: 'qtd_peixes', label: 'Qtd. Peixes', icon: Package, highlight: true, color: 'text-[#2d4518]', step: '1', integer: true, section: 'capacity' },
    { key: 'peso_total_kg', label: 'Biomassa Total', icon: Scale, unit: 'kg', highlight: true, section: 'capacity' },
    { key: 'densidade_kg_m2', label: 'Densidade alvo', icon: Droplets, unit: 'kg/m²', section: 'capacity' },
    { key: 'peso_entrada_kg', label: 'Peso Entrada (un)', icon: Scale, unit: 'g', scale: 1000, section: 'capacity' },
    { key: 'peso_transferencia_kg', label: 'Peso Transf. (un)', icon: Scale, unit: 'g', scale: 1000, color: 'text-[#2d4518]', section: 'capacity' },
    { key: 'peso_ganhar_kg', label: 'Peso a Ganhar', icon: Scale, unit: 'kg', section: 'capacity' },
    { key: 'racao_periodo_kg', label: 'Total do Período', icon: Calculator, unit: 'kg', highlight: true, color: 'text-amber-600', section: 'feeding' },
    { key: 'racao_mes_sc', label: 'Consumo Mensal', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding' },
    { key: 'racao_dia_sc', label: 'Consumo Diário', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding' },
    { key: 'racao_total_sc', label: 'Total Geral', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding' },
  ],
  recria: [
    { key: 'periodo_meses', label: 'Período (meses)', icon: Clock, unit: 'meses', step: '1', integer: true, section: 'capacity', hidden: true },
    { key: 'qtd_peixes', label: 'Qtd. Peixes', icon: Package, highlight: true, color: 'text-(--phase-recria)', step: '1', integer: true, section: 'capacity' },
    { key: 'peso_total_kg', label: 'Biomassa Total', icon: Scale, unit: 'kg', highlight: true, section: 'capacity' },
    { key: 'densidade_kg_m2', label: 'Densidade alvo', icon: Droplets, unit: 'kg/m²', section: 'capacity' },
    { key: 'peso_entrada_kg', label: 'Peso Entrada (un)', icon: Scale, unit: 'kg', section: 'capacity' },
    { key: 'peso_transferencia_kg', label: 'Peso Transf. (un)', icon: Scale, unit: 'kg', color: 'text-(--phase-recria)', section: 'capacity' },
    { key: 'peso_ganhar_kg', label: 'Peso a Ganhar', icon: Scale, unit: 'kg', section: 'capacity' },
    { key: 'racao_periodo_kg', label: 'Total do Período', icon: Calculator, unit: 'kg', highlight: true, color: 'text-amber-600', section: 'feeding' },
    { key: 'racao_mes_sc', label: 'Consumo Mensal', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding' },
    { key: 'racao_dia_sc', label: 'Consumo Diário', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding' },
    { key: 'racao_total_sc', label: 'Total Geral', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding' },
  ],
  engorda: [
    { key: 'periodo_meses', label: 'Período (meses)', icon: Clock, unit: 'meses', step: '1', integer: true, section: 'capacity', hidden: true },
    { key: 'qtd_peixes', label: 'Qtd. Peixes', icon: Package, highlight: true, color: 'text-blue-800', step: '1', integer: true, section: 'capacity' },
    { key: 'peso_total_kg', label: 'Biomassa Total', icon: Scale, unit: 'kg', highlight: true, section: 'capacity' },
    { key: 'densidade_kg_m2', label: 'Densidade final', icon: Droplets, unit: 'kg/m²', section: 'capacity' },
    { key: 'peso_entrada_kg', label: 'Peso Entrada (un)', icon: Scale, unit: 'kg', section: 'capacity' },
    { key: 'peso_final_kg_peixe', label: 'Peso Abate (un)', icon: Scale, unit: 'kg', color: 'text-blue-800', section: 'capacity' },
    { key: 'peso_ganhar_kg', label: 'Peso a Ganhar', icon: Scale, unit: 'kg', section: 'capacity' },
    { key: 'racao_periodo_kg', label: 'Ração Total Período', icon: Calculator, unit: 'kg', highlight: true, color: 'text-amber-600', section: 'feeding' },
    { key: 'racao_mes_sc', label: 'Consumo Mensal', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding' },
    { key: 'racao_total_sc', label: 'Total Sacos', icon: Calculator, unit: 'sacos', color: 'text-amber-600', section: 'feeding' },
    { key: 'conversao_alimentar', label: 'Conv. Alimentar (FCA)', icon: RefreshCw, unit: 'x', color: 'text-indigo-600', section: 'feeding' },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getLoteValue(
  lote: BercarioLote | RecriaLote | EngordaLote | undefined,
  key: EditableMetricField
): number {
  if (!lote || !isRecord(lote)) return 0;
  const val = lote[key];
  return typeof val === 'number' ? val : 0;
}

export default function TankDetailPanel({
  tank,
  bercarioLote,
  recriaLote,
  engordaLote,
  onClose,
}: TankDetailPanelProps) {
  const [isPhaseTooltipOpen, setIsPhaseTooltipOpen] = useState(false);
  const [phaseSubfaseDraft, setPhaseSubfaseDraft] = useState(tank.subfase ?? '');
  const [quickEdit, setQuickEdit] = useState<QuickEditState | null>(null);
  const skipBlurCommitRef = useRef(false);
  const firstPhaseButtonRef = useRef<HTMLButtonElement | null>(null);

  const updateTankPhase = useStore((s) => s.updateTankPhase);
  const updateBercarioLote = useStore((s) => s.updateBercarioLote);
  const updateRecriaLote = useStore((s) => s.updateRecriaLote);
  const updateEngordaLote = useStore((s) => s.updateEngordaLote);
  const addBercarioLote = useStore((s) => s.addBercarioLote);
  const addRecriaLote = useStore((s) => s.addRecriaLote);
  const addEngordaLote = useStore((s) => s.addEngordaLote);

  const lote = useMemo(() => {
    if (tank.phase === 'bercario') return bercarioLote;
    if (tank.phase === 'recria') return recriaLote;
    if (tank.phase === 'engorda') return engordaLote;
    return undefined;
  }, [tank.phase, bercarioLote, recriaLote, engordaLote]);

  const fields = useMemo(() => {
    if (tank.phase === 'vazio') return [];
    return PHASE_FIELDS[tank.phase] ?? [];
  }, [tank.phase]);

  const capacityFields = useMemo(() => fields.filter((f) => f.section === 'capacity' && !f.hidden), [fields]);
  const feedingFields = useMemo(() => fields.filter((f) => f.section === 'feeding' && !f.hidden), [fields]);

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
    if (!quickEdit) return true;
    const parsed = Number(quickEdit.inputValue.replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      setQuickEdit(null);
      return false;
    }
    const normalizedValue = quickEdit.integer ? Math.round(parsed) : parsed;
    const storedValue = normalizedValue / (quickEdit.scale ?? 1);

    if (tank.phase === 'bercario') {
      const patch: Partial<BercarioLote> = { [quickEdit.fieldKey]: storedValue };
      updateBercarioLote(tank.id, patch);
    } else if (tank.phase === 'recria') {
      const patch: Partial<RecriaLote> = { [quickEdit.fieldKey]: storedValue };
      updateRecriaLote(tank.id, patch);
    } else if (tank.phase === 'engorda') {
      const patch: Partial<EngordaLote> = { [quickEdit.fieldKey]: storedValue };
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

    const orderedFields = fields;
    if (event.key === 'Tab' && orderedFields.length > 0 && quickEdit) {
      event.preventDefault();
      skipBlurCommitRef.current = true;

      const saved = handleQuickEditSave();
      if (!saved) return;

      const currentIdx = orderedFields.findIndex((f) => f.key === quickEdit.fieldKey);
      if (currentIdx === -1) return;

      const nextIdx = event.shiftKey
        ? (currentIdx - 1 + orderedFields.length) % orderedFields.length
        : (currentIdx + 1) % orderedFields.length;

      const next = orderedFields[nextIdx];
      const rawValue = getLoteValue(lote, next.key);
      const scale = next.scale ?? 1;

      setQuickEdit({
        fieldKey: next.key,
        label: next.label,
        unit: next.unit,
        step: next.step ?? '0.001',
        integer: next.integer,
        scale: next.scale,
        inputValue: (rawValue * scale).toString(),
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
    if (!isPhaseTooltipOpen) return;
    const id = requestAnimationFrame(() => {
      firstPhaseButtonRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isPhaseTooltipOpen]);


  const applyPhaseChange = (nextPhase: TankPhase) => {
    if (nextPhase === 'vazio' && hasLoteActive) {
      const ok = window.confirm(
        'Mudar para Vazio removerá os dados do lote atual. Deseja continuar?'
      );
      if (!ok) return;
    }
    if (nextPhase !== tank.phase && hasLoteActive) {
      const ok = window.confirm(
        `Mudar a fase para ${PHASE_LABELS[nextPhase]} migrará o lote atual. Deseja continuar?`
      );
      if (!ok) return;
    }
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

  const renderPeriodoEdit = () => {
    if (tank.phase === 'bercario' || !lote) return null;
    const meses = getLoteValue(lote, 'periodo_meses');
    if (quickEdit?.fieldKey === 'periodo_meses') {
      return (
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary/70" />
          <input
            autoFocus
            type="number"
            step="1"
            value={quickEdit.inputValue}
            onChange={(e) => updateQuickEditInputValue(e.target.value)}
            onBlur={handleInlineBlur}
            onKeyDown={handleInlineKeyDown}
            className="w-12 bg-transparent text-xs font-medium text-foreground outline-none"
          />
          meses
        </div>
      );
    }
    return (
      <button
        type="button"
        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
        title="Clique para editar período"
        onClick={() =>
          openQuickEdit({
            fieldKey: 'periodo_meses',
            label: 'Período (meses)',
            value: meses,
            unit: 'meses',
            step: '1',
            integer: true,
          })
        }
      >
        <Clock className="w-3.5 h-3.5 text-primary/70" />
        {meses} meses
      </button>
    );
  };

  const capacityTitle = tank.phase === 'engorda' ? 'Capacidade & Produção Final' : 'Capacidade & Produção Projetada';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border bg-muted/30 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground font-heading leading-none">
              Tanque {tank.id.toString().padStart(2, '0')}
            </h2>
            <Popover open={isPhaseTooltipOpen} onOpenChange={setIsPhaseTooltipOpen}>
              <PopoverTrigger
                render={
                  <button type="button" className="inline-flex cursor-pointer" />
                }
              >
                <PhaseBadge phase={tank.phase} size="md" />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" side="bottom" sideOffset={6}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 mb-1.5">
                  Alterar fase
                </p>
                <div className="space-y-0.5">
                  {PHASE_OPTIONS.map((p) => (
                    <button
                      key={p}
                      ref={p === tank.phase ? firstPhaseButtonRef : undefined}
                      type="button"
                      onClick={() => applyPhaseChange(p)}
                      className={cn(
                        'flex items-center w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors duration-150',
                        'hover:bg-muted/80',
                        p === tank.phase && 'bg-muted ring-1 ring-border'
                      )}
                    >
                      <PhaseBadge phase={p} size="sm" showDot />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-primary/70" />
              {tank.area_m2.toLocaleString('pt-BR')} m² ({tank.area_ha} ha)
            </span>
            {tank.subfase && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <div className={cn('w-1.5 h-1.5 rounded-full', getPhaseDotColor(tank.phase))} />
                  {tank.subfase}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              handleQuickEditSave();
              setIsPhaseTooltipOpen(false);
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Fechar drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar relative">
        {!hasLoteActive && tank.phase !== 'vazio' ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <div className="grid grid-cols-2 gap-3 w-full mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Package className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Sem lote cadastrado</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Este tanque está definido como <strong>{PHASE_LABELS[tank.phase]}</strong>, mas nenhum lote foi inicializado para preencher as projeções.
            </p>
            <Button
              onClick={handleInitializeLote}
              className="rounded-full px-6 py-2.5 text-sm font-medium shadow-md shadow-primary/25 transition-all hover:scale-105"
            >
              <Pencil className="w-4 h-4" />
              Inicializar Lote
            </Button>
          </div>
        ) : tank.phase === 'vazio' ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Droplets className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Tanque Vazio</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Mude a fase do tanque para designar um novo lote de produção e calcular as projeções de crescimento.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {/* Capacidade & Produção */}
            <div>
              {tank.phase === 'bercario' ? (
                <SectionTitle>{capacityTitle}</SectionTitle>
              ) : (
                <div className="flex items-end justify-between mb-3 mt-6 first:mt-0">
                  <div className="flex items-center gap-3 w-full">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{capacityTitle}</h3>
                    <div className="w-full h-px bg-gradient-to-r from-border to-transparent" />
                  </div>
                  {renderPeriodoEdit()}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {capacityFields.map((field) => {
                  const rawValue = getLoteValue(lote, field.key);
                  const displayValue = rawValue * (field.scale ?? 1);
                  const isEditingField = quickEdit?.fieldKey === field.key;
                  return (
                    <MetricCard
                      key={field.key}
                      variant="compact"
                      icon={field.icon}
                      label={field.label}
                      value={displayValue}
                      unit={field.unit}
                      color={field.color}
                      highlight={field.highlight}
                      onEdit={() =>
                        openQuickEdit({
                          fieldKey: field.key,
                          label: field.label,
                          value: rawValue,
                          unit: field.unit,
                          step: field.step,
                          integer: field.integer,
                          scale: field.scale,
                        })
                      }
                      isEditing={isEditingField}
                      editValue={quickEdit?.inputValue ?? ''}
                      onEditChange={updateQuickEditInputValue}
                      onEditBlur={handleInlineBlur}
                      onEditKeyDown={handleInlineKeyDown}
                      step={field.step ?? '0.001'}
                    />
                  );
                })}
              </div>
            </div>

            {/* Manejo Alimentar */}
            <div>
              <SectionTitle>Manejo Alimentar (Projeção)</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {feedingFields.map((field) => {
                  const rawValue = getLoteValue(lote, field.key);
                  const displayValue = rawValue * (field.scale ?? 1);
                  const isEditingField = quickEdit?.fieldKey === field.key;
                  return (
                    <MetricCard
                      key={field.key}
                      variant="compact"
                      icon={field.icon}
                      label={field.label}
                      value={displayValue}
                      unit={field.unit}
                      color={field.color}
                      highlight={field.highlight}
                      onEdit={() =>
                        openQuickEdit({
                          fieldKey: field.key,
                          label: field.label,
                          value: rawValue,
                          unit: field.unit,
                          step: field.step,
                          integer: field.integer,
                          scale: field.scale,
                        })
                      }
                      isEditing={isEditingField}
                      editValue={quickEdit?.inputValue ?? ''}
                      onEditChange={updateQuickEditInputValue}
                      onEditBlur={handleInlineBlur}
                      onEditKeyDown={handleInlineKeyDown}
                      step={field.step ?? '0.001'}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
