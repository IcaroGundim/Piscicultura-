'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import type { Premissas } from '@/lib/types';
import { Check, Loader2, CloudCheck } from 'lucide-react';
import { useProductionMetrics } from '@/lib/hooks/useProductionMetrics';
import { cn } from '@/lib/utils';
import ConfiguracoesPanel from '@/components/Custos/ConfiguracoesPanel';
import LancamentosPanel from '@/components/Custos/LancamentosPanel';

type SaveStatus = 'idle' | 'saving' | 'saved';

const MONTH_LABELS_FULL_PAGE = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return 'nunca';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'nunca';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Salvando…
      </div>
    );
  }
  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
        <Check className="h-3.5 w-3.5" />
        Salvo no servidor
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70">
      <CloudCheck className="h-3.5 w-3.5" />
      Auto-save ativo
    </div>
  );
}

export default function CustosPage() {
  const premissas = useStore((s) => s.activePremissas);
  const custos = useStore((s) => s.activeCustos);
  const updatePremissas = useStore((s) => s.updatePremissas);
  const referenceMonth = useStore((s) => s.referenceMonth);
  const referenceYear = useStore((s) => s.referenceYear);
  const updatedAt = useStore((s) => s.updatedAt);
  const metrics = useProductionMetrics();
  const { isMensal, periodFactor, periodLabelShort } = metrics;

  const periodTitle = isMensal
    ? `${MONTH_LABELS_FULL_PAGE[referenceMonth]}/${referenceYear}`
    : 'Anual';

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeTab, setActiveTab] = useState<'lancamentos' | 'config'>('lancamentos');
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    []
  );

  const markPendingSave = useCallback(() => {
    setSaveStatus('saving');
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savingTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2200);
    }, 900);
  }, []);

  const setPremissa = useCallback(
    <K extends keyof Premissas>(key: K, value: Premissas[K]) => {
      updatePremissas({ [key]: value } as Partial<Premissas>);
      markPendingSave();
    },
    [updatePremissas, markPendingSave]
  );

  return (
    <div className="min-w-0 px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">Custos e Receitas</h1>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                isMensal
                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                  : 'border-primary/30 bg-primary/10 text-primary'
              )}
            >
              {isMensal ? `Mensal · ${periodTitle}` : 'Anual'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isMensal
              ? `Valores referentes a 1 mês de operação — ${periodTitle.toLowerCase()}.`
              : 'Valores anuais — alterações salvam automaticamente.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <SaveIndicator status={saveStatus} />
          <span className="text-[10px] text-muted-foreground/70 tabular-nums">
            Última gravação: {formatUpdatedAt(updatedAt)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-lg border border-border bg-card p-1 shadow-sm">
        {([
          { id: 'lancamentos', label: 'Lançamentos' },
          { id: 'config', label: 'Configurações' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'lancamentos' && (
        <LancamentosPanel
          lancamentos={custos.lancamentos}
          onChange={markPendingSave}
        />
      )}

      {activeTab === 'config' && (
        <ConfiguracoesPanel
          premissas={premissas}
          custos={custos}
          periodFactor={periodFactor}
          periodLabelShort={periodLabelShort}
          periodTitle={periodTitle}
          isMensal={isMensal}
          onSetPremissa={setPremissa}
        />
      )}
    </div>
  );
}
