'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { anosDisponiveis } from '@/lib/lancamentos';
import type { Premissas } from '@/lib/types';
import { Check, Loader2, CloudCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfiguracoesPanel from '@/components/Custos/ConfiguracoesPanel';
import LancamentosPanel from '@/components/Custos/LancamentosPanel';
import ResumoPanel, { ResumoControls, type Granularidade } from '@/components/Custos/ResumoPanel';

type SaveStatus = 'idle' | 'saving' | 'saved';

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
  const updatedAt = useStore((s) => s.updatedAt);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeTab, setActiveTab] = useState<'lancamentos' | 'resumo' | 'config'>('lancamentos');

  // Estado dos controles do Resumo (levantado para ficar na barra de abas).
  const [resumoGranularidade, setResumoGranularidade] = useState<Granularidade>('mensal');
  const [resumoAno, setResumoAno] = useState<number>(() => new Date().getFullYear());
  const anosResumo = useMemo(() => {
    const list = anosDisponiveis(custos.lancamentos);
    if (list.length === 0) list.push(new Date().getFullYear());
    return list;
  }, [custos.lancamentos]);
  const anoResumoEfetivo = anosResumo.includes(resumoAno) ? resumoAno : anosResumo[0];
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
            <h1 className="text-xl font-semibold text-foreground">Custos e Receitas</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Lançamentos, resumo e premissas — alterações salvam automaticamente.
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          {(
            [
              { id: 'lancamentos', label: 'Lançamentos' },
              { id: 'resumo', label: 'Resumo' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'resumo' && (
          <ResumoControls
            granularidade={resumoGranularidade}
            onGranularidadeChange={setResumoGranularidade}
            ano={anoResumoEfetivo}
            onAnoChange={setResumoAno}
            anos={anosResumo}
          />
        )}
      </div>

      {activeTab === 'lancamentos' && (
        <LancamentosPanel lancamentos={custos.lancamentos} onChange={markPendingSave} />
      )}

      {activeTab === 'resumo' && (
        <ResumoPanel
          lancamentos={custos.lancamentos}
          granularidade={resumoGranularidade}
          ano={anoResumoEfetivo}
        />
      )}

      {activeTab === 'config' && (
        <ConfiguracoesPanel
          premissas={premissas}
          custos={custos}
          onSetPremissa={setPremissa}
        />
      )}
    </div>
  );
}
