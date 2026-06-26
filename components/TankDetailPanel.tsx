'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, TankPhase } from '@/lib/types';
import { PHASE_LABELS, MOVIMENTACAO_TIPO_LABELS } from '@/lib/types';
import { useStore } from '@/lib/store';
import { extratoComSaldo } from '@/lib/movimentacoes';
import PhaseBadge from './PhaseBadge';
import PhaseChangeMenu from './PhaseChangeMenu';
import MovimentacaoDialog from './MovimentacaoDialog';
import {
  X,
  Pencil,
  Droplets,
  Package,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MetricFieldsList } from './MetricFieldsList';
import { SectionTitle } from './SectionTitle';
import {
  PHASE_FIELDS,
  getLoteValue,
  type EditableMetricField,
  type FieldDef,
  type QuickEditState,
} from '@/lib/tankFields';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface TankDetailPanelProps {
  tank: Tank;
  bercarioLote?: BercarioLote;
  recriaLote?: RecriaLote;
  engordaLote?: EngordaLote;
  onClose: () => void;
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
  const [isMovDialogOpen, setIsMovDialogOpen] = useState(false);
  const [isAreaEditing, setIsAreaEditing] = useState(false);
  const [areaDraft, setAreaDraft] = useState(tank.area_m2.toString());
  const skipBlurCommitRef = useRef(false);
  const skipAreaBlurCommitRef = useRef(false);
  const firstPhaseButtonRef = useRef<HTMLButtonElement | null>(null);

  const updateTankPhase = useStore((s) => s.updateTankPhase);
  const updateTankArea = useStore((s) => s.updateTankArea);
  const updateBercarioLote = useStore((s) => s.updateBercarioLote);
  const updateRecriaLote = useStore((s) => s.updateRecriaLote);
  const updateEngordaLote = useStore((s) => s.updateEngordaLote);
  const addBercarioLote = useStore((s) => s.addBercarioLote);
  const addRecriaLote = useStore((s) => s.addRecriaLote);
  const addEngordaLote = useStore((s) => s.addEngordaLote);
  const movimentacoes = useStore((s) => s.activeMovimentacoes);
  const removeMovimentacao = useStore((s) => s.removeMovimentacao);

  const extrato = useMemo(
    () => extratoComSaldo(tank.id, movimentacoes).reverse(),
    [tank.id, movimentacoes]
  );

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

  const capacityFields = useMemo(
    () => fields.filter((f) => f.section === 'capacity' && !f.hidden),
    [fields]
  );
  const feedingFields = useMemo(
    () => fields.filter((f) => f.section === 'feeding' && !f.hidden),
    [fields]
  );

  const handleInitializeLote = () => {
    if (tank.phase === 'bercario' && !bercarioLote) {
      addBercarioLote({
        tankId: tank.id,
        nome: '',
        qtd_peixes: 0,
        peso_entrada_kg: 0,
        peso_ganhar_kg: 0,
        racao_periodo_kg: 0,
        peso_total_kg: 0,
        densidade_kg_m2: 0,
        peso_transferencia_kg: 0.1,
        racao_dia_sc: 0,
        racao_mes_sc: 0,
        racao_total_sc: 0,
      });
    } else if (tank.phase === 'recria' && !recriaLote) {
      addRecriaLote({
        tankId: tank.id,
        qtd_peixes: 0,
        peso_entrada_kg: 0,
        peso_ganhar_kg: 0,
        racao_periodo_kg: 0,
        peso_total_kg: 0,
        densidade_kg_m2: 0,
        peso_transferencia_kg: 0.7,
        racao_dia_sc: 0,
        racao_mes_sc: 0,
        racao_total_sc: 0,
        periodo_meses: 5,
      });
    } else if (tank.phase === 'engorda' && !engordaLote) {
      addEngordaLote({
        tankId: tank.id,
        modulo: '',
        qtd_peixes: 0,
        peso_entrada_kg: 0,
        peso_ganhar_kg: 0,
        racao_periodo_kg: 0,
        conversao_alimentar: 2,
        peso_final_kg_peixe: 2.5,
        peso_total_kg: 0,
        densidade_kg_m2: 0,
        racao_dia_sc: 0,
        racao_mes_sc: 0,
        racao_total_sc: 0,
        periodo_meses: 5,
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

  const handleEditField = (field: FieldDef, value: number) => {
    openQuickEdit({
      fieldKey: field.key,
      label: field.label,
      value,
      unit: field.unit,
      step: field.step,
      integer: field.integer,
      scale: field.scale,
    });
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

      if (quickEdit.fieldKey === 'peso_entrada_kg') {
        const qtdPeixes = getLoteValue(lote, 'qtd_peixes');
        patch.peso_entrada_kg = storedValue * qtdPeixes;
      } else if (quickEdit.fieldKey === 'qtd_peixes') {
        const currentQtd = getLoteValue(lote, 'qtd_peixes');
        const currentPesoEntradaUn =
          currentQtd > 0 ? getLoteValue(lote, 'peso_entrada_kg') / currentQtd : 0;
        patch.peso_entrada_kg = currentPesoEntradaUn * storedValue;
      }

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

    const orderedFields = fields.filter((field) => !field.computed);
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
    if (!isAreaEditing) {
      setAreaDraft(tank.area_m2.toString());
    }
  }, [isAreaEditing, tank.area_m2]);

  useEffect(() => {
    if (!isPhaseTooltipOpen) return;
    const id = requestAnimationFrame(() => {
      firstPhaseButtonRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isPhaseTooltipOpen]);

  const openAreaEdit = () => {
    handleQuickEditSave();
    setIsAreaEditing(true);
    setAreaDraft(tank.area_m2.toString());
  };

  const handleAreaSave = () => {
    const parsed = Number(areaDraft.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed > 0) {
      updateTankArea(tank.id, parsed);
    } else {
      setAreaDraft(tank.area_m2.toString());
    }
    setIsAreaEditing(false);
  };

  const handleAreaKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      skipAreaBlurCommitRef.current = true;
      setAreaDraft(tank.area_m2.toString());
      setIsAreaEditing(false);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleAreaSave();
    }
  };

  const handleAreaBlur = () => {
    if (skipAreaBlurCommitRef.current) {
      skipAreaBlurCommitRef.current = false;
      return;
    }
    handleAreaSave();
  };

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

  const hasLoteActive =
    (tank.phase === 'bercario' && bercarioLote) ||
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
            aria-label="Período em meses"
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-brand/30 bg-brand px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="min-w-0 text-lg font-bold text-brand-foreground font-heading leading-tight sm:text-xl sm:leading-none">
              Tanque {tank.id.toString().padStart(2, '0')}
            </h2>
            <Popover open={isPhaseTooltipOpen} onOpenChange={setIsPhaseTooltipOpen}>
              <PopoverTrigger
                render={<button type="button" className="inline-flex cursor-pointer" />}
              >
                <PhaseBadge phase={tank.phase} size="md" editable />
              </PopoverTrigger>
              <PopoverContent
                className="w-48 max-w-[calc(100vw-2rem)] p-2"
                side="bottom"
                align="start"
                sideOffset={6}
              >
                <PhaseChangeMenu
                  currentPhase={tank.phase}
                  onSelect={applyPhaseChange}
                  firstItemRef={firstPhaseButtonRef}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-foreground sm:text-sm">
            {isAreaEditing ? (
              <span className="flex min-w-0 items-center gap-1.5 rounded-md bg-brand-foreground/10 px-2 py-1 ring-1 ring-brand-foreground/25">
                <Droplets className="w-3.5 h-3.5 shrink-0 text-brand-foreground/70" />
                <input
                  autoFocus
                  type="number"
                  min="1"
                  step="1"
                  value={areaDraft}
                  onChange={(event) => setAreaDraft(event.target.value)}
                  onBlur={handleAreaBlur}
                  onKeyDown={handleAreaKeyDown}
                  aria-label="Área do tanque em metros quadrados"
                  className="w-24 bg-transparent text-xs font-medium text-brand-foreground outline-none sm:text-sm"
                />
                <span>m²</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={openAreaEdit}
                className="flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-brand-foreground/10 hover:text-brand-foreground"
                title="Clique para editar a área do tanque"
              >
                <Droplets className="w-3.5 h-3.5 shrink-0 text-brand-foreground/70" />
                {tank.area_m2.toLocaleString('pt-BR')} m² ({tank.area_ha} ha)
                <Pencil className="h-3 w-3 shrink-0 opacity-60" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              handleQuickEditSave();
              if (isAreaEditing) handleAreaSave();
              setIsPhaseTooltipOpen(false);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-brand-foreground/70 hover:text-brand-foreground hover:bg-brand-foreground/10 transition-colors sm:h-8 sm:w-8"
            aria-label="Fechar drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar relative sm:px-5 sm:py-5">
        {!hasLoteActive && tank.phase !== 'vazio' ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-1.5 text-base font-semibold text-foreground">Sem lote cadastrado</h3>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Fase{' '}
              <strong className="font-semibold text-foreground">{PHASE_LABELS[tank.phase]}</strong>{' '}
              definida, mas ainda sem lote para gerar as projeções.
            </p>
            <Button
              onClick={handleInitializeLote}
              className="rounded-full px-6 text-sm font-medium shadow-sm shadow-primary/25 transition-transform hover:scale-[1.03]"
            >
              <Pencil className="h-4 w-4" />
              Inicializar Lote
            </Button>
          </div>
        ) : tank.phase === 'vazio' ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
              <Droplets className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1.5 text-base font-semibold text-foreground">Tanque vazio</h3>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Altere a fase no topo para designar um novo lote e calcular as projeções de
              crescimento.
            </p>
          </div>
        ) : (
          <div className="space-y-5 pb-2 sm:space-y-6">
            {/* Capacidade & Produção */}
            <div>
              <SectionTitle action={renderPeriodoEdit()}>Capacidade &amp; Produção</SectionTitle>
              <MetricFieldsList
                fields={capacityFields}
                phase={tank.phase}
                lote={lote}
                quickEdit={quickEdit}
                onEditField={handleEditField}
                onEditChange={updateQuickEditInputValue}
                onEditBlur={handleInlineBlur}
                onEditKeyDown={handleInlineKeyDown}
              />
            </div>

            {/* Manejo Alimentar */}
            <div>
              <SectionTitle>Manejo Alimentar (Projeção)</SectionTitle>
              <MetricFieldsList
                fields={feedingFields}
                phase={tank.phase}
                lote={lote}
                quickEdit={quickEdit}
                onEditField={handleEditField}
                onEditChange={updateQuickEditInputValue}
                onEditBlur={handleInlineBlur}
                onEditKeyDown={handleInlineKeyDown}
              />
            </div>

            {/* Movimentações */}
            <div>
              <SectionTitle
                action={
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickEditSave();
                      setIsMovDialogOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Registrar
                  </button>
                }
              >
                Movimentações
              </SectionTitle>

              {extrato.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
                  Nenhuma movimentação registrada. Use “Registrar” para povoar, ajustar ou
                  transferir peixes.
                </p>
              ) : (
                <ul className="overflow-hidden rounded-xl border border-foreground/30 divide-y divide-border/60">
                  {extrato.map(({ mov, saldo }) => {
                    const isSaida = mov.direcao === 'saida';
                    return (
                      <li
                        key={mov.id}
                        className="group/mov flex items-center gap-3 px-3 py-2.5 hover:bg-primary/[0.03]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="truncate text-sm text-foreground">
                            {MOVIMENTACAO_TIPO_LABELS[mov.tipo]}
                            {mov.tipo === 'transferencia' && mov.tankDestino != null && (
                              <span className="text-muted-foreground">
                                {' '}
                                → T{mov.tankDestino.toString().padStart(2, '0')}
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {String(mov.mes).padStart(2, '0')}/{mov.ano}
                            {mov.descricao ? ` · ${mov.descricao}` : ''}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-right leading-none">
                            <span className="block text-lg font-bold tabular-nums text-foreground">
                              {saldo.toLocaleString('pt-BR')}
                            </span>
                            <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">
                              saldo
                            </span>
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                              isSaida
                                ? 'bg-red-500/10 text-red-600'
                                : 'bg-emerald-500/10 text-emerald-600'
                            )}
                          >
                            {isSaida ? '−' : '+'}
                            {mov.quantidade.toLocaleString('pt-BR')}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm('Excluir esta movimentação? O saldo será recalculado.')
                            ) {
                              removeMovimentacao(mov.id);
                            }
                          }}
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground/30 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover/mov:opacity-100"
                          title="Excluir movimentação"
                          aria-label="Excluir movimentação"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <MovimentacaoDialog
        open={isMovDialogOpen}
        onClose={() => setIsMovDialogOpen(false)}
        tank={tank}
      />
    </div>
  );
}
