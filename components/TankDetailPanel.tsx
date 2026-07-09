'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { useStore } from '@/lib/store';
import { saldoDoTanque } from '@/lib/movimentacoes';
import PhaseBadge from './PhaseBadge';
import PhaseChangeMenu from './PhaseChangeMenu';
import {
  X,
  Pencil,
  Droplets,
  Package,
  Clock,
  Plus,
  Fish,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

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
  const now = new Date();
  const [isPhaseTooltipOpen, setIsPhaseTooltipOpen] = useState(false);
  const [phaseSubfaseDraft, setPhaseSubfaseDraft] = useState(tank.subfase ?? '');
  const [quickEdit, setQuickEdit] = useState<QuickEditState | null>(null);
  const [isAreaEditing, setIsAreaEditing] = useState(false);
  const [areaDraft, setAreaDraft] = useState(tank.area_m2.toString());
  const [inclusaoQtd, setInclusaoQtd] = useState('');
  const [inclusaoMes, setInclusaoMes] = useState(now.getMonth() + 1);
  const [inclusaoAno, setInclusaoAno] = useState(now.getFullYear());
  const [origemTankId, setOrigemTankId] = useState<number | null>(null);
  const skipBlurCommitRef = useRef(false);
  const skipAreaBlurCommitRef = useRef(false);
  const firstPhaseButtonRef = useRef<HTMLButtonElement | null>(null);

  const updateTankPhase = useStore((s) => s.updateTankPhase);
  const updateTankArea = useStore((s) => s.updateTankArea);
  const updateBercarioLote = useStore((s) => s.updateBercarioLote);
  const updateRecriaLote = useStore((s) => s.updateRecriaLote);
  const updateEngordaLote = useStore((s) => s.updateEngordaLote);
  const addMovimentacao = useStore((s) => s.addMovimentacao);
  const transferirPeixes = useStore((s) => s.transferirPeixes);
  const addBercarioLote = useStore((s) => s.addBercarioLote);
  const addRecriaLote = useStore((s) => s.addRecriaLote);
  const addEngordaLote = useStore((s) => s.addEngordaLote);
  const allTanks = useStore((s) => s.activeTanks);
  const movimentacoes = useStore((s) => s.activeMovimentacoes);

  const saldoAtual = useMemo(
    () => saldoDoTanque(tank.id, movimentacoes),
    [tank.id, movimentacoes]
  );

  /** Fase de origem típica no fluxo: berçário → recria → engorda. */
  const origemPhase: Exclude<TankPhase, 'vazio'> | null =
    tank.phase === 'recria' ? 'bercario' : tank.phase === 'engorda' ? 'recria' : null;
  const isTransferPhase = origemPhase != null;

  const tanquesOrigem = useMemo(() => {
    if (!origemPhase) return [];
    return allTanks.filter((t) => t.phase === origemPhase && t.id !== tank.id);
  }, [allTanks, origemPhase, tank.id]);

  const saldoOrigem = useMemo(
    () => (origemTankId != null ? saldoDoTanque(origemTankId, movimentacoes) : null),
    [origemTankId, movimentacoes]
  );

  useEffect(() => {
    if (!isTransferPhase) {
      setOrigemTankId(null);
      return;
    }
    setOrigemTankId((prev) => {
      if (prev != null && tanquesOrigem.some((t) => t.id === prev)) return prev;
      return tanquesOrigem[0]?.id ?? null;
    });
  }, [isTransferPhase, tanquesOrigem, tank.id]);

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

  // Saldo unitário fica no formulário de inclusão; omitir da lista de métricas.
  const capacityFields = useMemo(
    () => fields.filter((f) => f.section === 'capacity' && !f.hidden && f.key !== 'qtd_peixes'),
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

  const movimentoLabel =
    tank.phase === 'bercario'
      ? 'Incluir alevinos'
      : tank.phase === 'recria'
        ? 'Transferir do berçário'
        : tank.phase === 'engorda'
          ? 'Transferir da recria'
          : 'Movimentar';
  const inclusaoQtdNum = Math.max(0, Math.floor(Number(inclusaoQtd.replace(/\D/g, '')) || 0));
  const dataValida =
    inclusaoMes >= 1 && inclusaoMes <= 12 && inclusaoAno >= 1900 && inclusaoAno <= 3000;
  const podePovoar = !isTransferPhase && inclusaoQtdNum > 0 && dataValida;
  const podeTransferir =
    isTransferPhase &&
    origemTankId != null &&
    inclusaoQtdNum > 0 &&
    dataValida &&
    saldoOrigem != null &&
    saldoOrigem > 0 &&
    inclusaoQtdNum <= saldoOrigem;
  const podeSubmeter = isTransferPhase ? podeTransferir : podePovoar;

  const handleMovimentarPeixes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSubmeter || tank.phase === 'vazio') return;
    handleQuickEditSave();

    if (isTransferPhase && origemTankId != null) {
      transferirPeixes({
        origemTankId,
        destinoTankId: tank.id,
        quantidade: inclusaoQtdNum,
        faseDestino: tank.phase,
        ano: inclusaoAno,
        mes: inclusaoMes,
      });
    } else {
      addMovimentacao({
        tankId: tank.id,
        tipo: 'povoamento',
        direcao: 'entrada',
        quantidade: inclusaoQtdNum,
        ano: inclusaoAno,
        mes: inclusaoMes,
        faseTanque: tank.phase,
      });
    }
    setInclusaoQtd('');
  };

  const renderPeriodoEdit = () => {
    if (tank.phase === 'bercario' || !lote) return null;
    const meses = getLoteValue(lote, 'periodo_meses');
    if (quickEdit?.fieldKey === 'periodo_meses') {
      return (
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/30 bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground shadow-sm ring-2 ring-brand/25">
          <Clock className="h-3.5 w-3.5 text-brand-foreground/80" />
          <input
            autoFocus
            type="number"
            step="1"
            value={quickEdit.inputValue}
            onChange={(e) => updateQuickEditInputValue(e.target.value)}
            onBlur={handleInlineBlur}
            onKeyDown={handleInlineKeyDown}
            aria-label="Período em meses"
            className="w-10 bg-transparent text-xs font-semibold tabular-nums text-brand-foreground outline-none"
          />
          <span className="text-brand-foreground/80">meses</span>
        </div>
      );
    }
    return (
      <button
        type="button"
        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-brand/30 bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
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
        <Clock className="h-3.5 w-3.5 text-brand-foreground/80" />
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

              <form
                onSubmit={handleMovimentarPeixes}
                className="mb-3 overflow-hidden rounded-xl border border-brand/30 bg-card shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 border-b border-brand/30 bg-brand px-3 py-2.5 sm:px-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                    {movimentoLabel}
                  </p>
                  <div className="flex items-center gap-1.5 rounded-lg border border-white/80 bg-white px-2.5 py-1 shadow-sm">
                    <Fish className="h-3.5 w-3.5 text-brand" />
                    <span className="text-sm font-bold tabular-nums text-brand">
                      {saldoAtual.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-brand/70">
                      saldo
                    </span>
                  </div>
                </div>
                <div className="space-y-2 bg-card p-3 sm:p-4">
                  {isTransferPhase && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="block">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Tanque de origem ({origemPhase ? PHASE_LABELS[origemPhase] : ''})
                        </span>
                        {tanquesOrigem.length === 0 ? (
                          <p className="mt-1 rounded-md border border-dashed border-border px-2 py-2 text-xs text-muted-foreground">
                            Nenhum tanque em {origemPhase ? PHASE_LABELS[origemPhase] : 'origem'}{' '}
                            disponível.
                          </p>
                        ) : (
                          <Select
                            value={origemTankId != null ? String(origemTankId) : ''}
                            onValueChange={(v) => setOrigemTankId(Number(v))}
                          >
                            <SelectTrigger className="mt-1 h-9 w-full focus-visible:border-brand focus-visible:ring-brand/20">
                              <SelectValue>
                                <span className="truncate text-sm">
                                  {origemTankId != null
                                    ? `Tanque ${origemTankId.toString().padStart(2, '0')}`
                                    : 'Selecione'}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {tanquesOrigem.map((t) => {
                                const s = saldoDoTanque(t.id, movimentacoes);
                                return (
                                  <SelectItem key={t.id} value={String(t.id)}>
                                    Tanque {t.id.toString().padStart(2, '0')} ·{' '}
                                    {s.toLocaleString('pt-BR')} un
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {saldoOrigem != null && (
                        <div className="flex flex-col justify-end rounded-md border border-border bg-muted/30 px-3 py-2">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Saldo na origem
                          </span>
                          <span className="text-sm font-bold tabular-nums text-foreground">
                            {saldoOrigem.toLocaleString('pt-BR')} un
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={
                      isTransferPhase
                        ? 'grid grid-cols-2 gap-2 sm:grid-cols-4'
                        : 'grid grid-cols-2 gap-2 sm:grid-cols-4'
                    }
                  >
                    <label className="col-span-2 block sm:col-span-1">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Quantidade (un)
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={inclusaoQtd}
                        onChange={(e) => setInclusaoQtd(e.target.value.replace(/\D/g, ''))}
                        className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                      {isTransferPhase &&
                        saldoOrigem != null &&
                        inclusaoQtdNum > saldoOrigem && (
                          <span className="mt-1 block text-[10px] text-red-600">
                            Acima do saldo da origem
                          </span>
                        )}
                    </label>
                    <div className="block">
                      <span className="text-[11px] font-medium text-muted-foreground">Mês</span>
                      <Select
                        value={String(inclusaoMes)}
                        onValueChange={(v) => setInclusaoMes(Number(v))}
                      >
                        <SelectTrigger className="mt-1 h-9 w-full focus-visible:border-brand focus-visible:ring-brand/20">
                          <SelectValue>
                            <span className="truncate text-sm">
                              {MONTH_LABELS[inclusaoMes - 1]}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MONTH_LABELS.map((label, i) => (
                            <SelectItem key={label} value={String(i + 1)}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <label className="block">
                      <span className="text-[11px] font-medium text-muted-foreground">Ano</span>
                      <input
                        type="number"
                        min={1900}
                        max={3000}
                        step={1}
                        value={inclusaoAno}
                        onChange={(e) =>
                          setInclusaoAno(Math.floor(Number(e.target.value) || now.getFullYear()))
                        }
                        className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm tabular-nums outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                    </label>
                    <div className="col-span-2 flex items-end sm:col-span-1">
                      <Button
                        type="submit"
                        disabled={!podeSubmeter}
                        className="h-9 w-full rounded-md bg-brand text-sm font-semibold text-brand-foreground shadow-sm hover:bg-brand/90 disabled:opacity-50"
                      >
                        {isTransferPhase ? (
                          <>
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            Transferir
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Incluir
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {tank.phase === 'engorda' && (
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      O saldo da engorda reduz com a <span className="font-medium text-foreground/80">venda de peixe</span> em Custos (abate vinculado ao tanque).
                    </p>
                  )}
                </div>
              </form>

              <MetricFieldsList
                fields={capacityFields}
                phase={tank.phase}
                lote={lote}
                quickEdit={quickEdit}
                onEditField={handleEditField}
                onEditChange={updateQuickEditInputValue}
                onEditBlur={handleInlineBlur}
                onEditKeyDown={handleInlineKeyDown}
                editableTitle="Parâmetros do lote"
                computedTitle="Capacidade calculada"
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
                editableTitle="Conversão alimentar"
                computedTitle="Consumo de ração"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
