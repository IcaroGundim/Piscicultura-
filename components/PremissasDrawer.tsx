'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Premissas, Custos } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NumberField } from '@/components/forms/NumberField';
import { Check, TrendingUp, Settings, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-md">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

interface PremissasDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PremissasDrawer({ open, onOpenChange }: PremissasDrawerProps) {
  const premissas = useStore((s) => s.activePremissas);
  const custos = useStore((s) => s.activeCustos);
  const updatePremissas = useStore((s) => s.updatePremissas);
  const updateCustos = useStore((s) => s.updateCustos);

  const [localPremissas, setLocalPremissas] = useState<Premissas>({ ...premissas });
  const [localCustos, setLocalCustos] = useState<Custos>({ ...custos });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalPremissas({ ...premissas });
      setLocalCustos({ ...custos });
      setSaved(false);
    }
  }, [open, premissas, custos]);

  const handleSave = () => {
    updatePremissas(localPremissas);
    updateCustos(localCustos);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const lucro = localCustos.receita_venda - localCustos.custo_racao - localCustos.outras_despesas;
  const margemLucro = localCustos.receita_venda > 0
    ? ((lucro / localCustos.receita_venda) * 100).toFixed(1)
    : '0';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[720px] sm:!max-w-3xl flex flex-col h-full p-0 bg-muted/40"
      >
        <SheetHeader className="px-5 pt-5 pb-3 shrink-0 bg-white border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Settings className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Premissas & Configurações
              </SheetTitle>
              <SheetDescription className="text-xs text-foreground/70 font-medium">
                Parâmetros globais de produção e financeiros
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SectionCard title="Parâmetros de Produção" icon={Settings}>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Produção Anual" unit="kg"
                  value={localPremissas.producao_anual}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, producao_anual: v })}
                  step="1000"
                />
                <NumberField
                  label="Conversão Alimentar" unit="kg/kg"
                  value={localPremissas.conversao_alimentar}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, conversao_alimentar: v })}
                />
                <NumberField
                  label="Ciclos/Ano" unit="ciclos"
                  value={localPremissas.ciclos_ano}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, ciclos_ano: v })}
                />
                <NumberField
                  label="Preço de Venda" unit="R$/kg"
                  value={localPremissas.preco_venda}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, preco_venda: v })}
                />
                <NumberField
                  label="Período Engorda" unit="meses"
                  value={localPremissas.periodo_engorda}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, periodo_engorda: v })}
                  step="1"
                />
                <NumberField
                  label="Período Recria" unit="meses"
                  value={localPremissas.periodo_recria}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, periodo_recria: v })}
                  step="1"
                />
              </div>
            </SectionCard>

            <SectionCard title="Pesos de Transferência" icon={Settings}>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Peso Final Engorda" unit="kg"
                  value={localPremissas.peso_final_engorda}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, peso_final_engorda: v })}
                />
                <NumberField
                  label="Transf. Recria→Engorda" unit="kg"
                  value={localPremissas.peso_transfer_recria}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, peso_transfer_recria: v })}
                />
                <NumberField
                  label="Transf. Berçário→Recria" unit="kg"
                  value={localPremissas.peso_transfer_bercario}
                  onChange={(v) => setLocalPremissas({ ...localPremissas, peso_transfer_bercario: v })}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded bg-(--phase-bercario)/22 border border-(--phase-bercario)/45 text-[#2d4518]">Berçário</span>
                <span className="text-muted-foreground/60">→ {localPremissas.peso_transfer_bercario} kg →</span>
                <span className="px-2 py-1 rounded bg-(--phase-recria)/12 border border-(--phase-recria)/28 text-(--phase-recria)">Recria</span>
                <span className="text-muted-foreground/60">→ {localPremissas.peso_transfer_recria} kg →</span>
                <span className="px-2 py-1 rounded bg-(--phase-engorda)/12 border border-(--phase-engorda)/35 text-blue-900">Engorda</span>
              </div>
            </SectionCard>

            <SectionCard title="Financeiro Anual" icon={TrendingUp}>
              <div className="grid grid-cols-1 gap-3">
                <NumberField
                  label="Receita — Venda de Peixes" unit="R$"
                  value={localCustos.receita_venda}
                  onChange={(v) => setLocalCustos({ ...localCustos, receita_venda: v })}
                  step="10000"
                />
                <NumberField
                  label="Custo — Ração" unit="R$"
                  value={localCustos.custo_racao}
                  onChange={(v) => setLocalCustos({ ...localCustos, custo_racao: v })}
                  step="10000"
                />
                <NumberField
                  label="Outras Despesas" unit="R$"
                  value={localCustos.outras_despesas}
                  onChange={(v) => setLocalCustos({ ...localCustos, outras_despesas: v })}
                  step="10000"
                />
              </div>
            </SectionCard>

            <SectionCard title="Resultado Estimado" icon={DollarSign}>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Receita Total</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    R$ {localCustos.receita_venda.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Custo Ração</span>
                  <span className="text-sm font-semibold text-red-600">
                    − R$ {localCustos.custo_racao.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Outras Despesas</span>
                  <span className="text-sm font-semibold text-red-600">
                    − R$ {localCustos.outras_despesas.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-foreground font-heading">
                    Lucro Estimado/Ano
                  </span>
                  <div className="text-right">
                    <p className={cn('text-lg font-bold font-heading', lucro >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      R$ {lucro.toLocaleString('pt-BR')}
                    </p>
                    <p className={cn('text-xs', lucro >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                      margem {margemLucro}%
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', lucro >= 0 ? 'bg-emerald-500' : 'bg-red-500')}
                      style={{ width: `${Math.min(Math.abs(parseFloat(margemLucro)), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <SheetFooter className="px-4 pb-4 pt-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 w-full min-h-[44px]',
              saved
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Check className="w-4 h-4" />
            {saved ? 'Salvo!' : 'Salvar Alterações'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function PremissasDrawerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 min-h-[40px]',
        'bg-primary/10 text-primary border border-primary/20',
        'hover:bg-primary/15 hover:border-primary/30 hover:shadow-sm hover:shadow-primary/10',
        'active:scale-95'
      )}
    >
      <Settings className="w-4 h-4" />
      <span className="hidden sm:inline">Premissas & Configurações</span>
    </button>
  );
}