'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { Premissas, Custos } from '@/lib/types';
import {
  custoMaoObraAnual,
  custoRacaoAnual,
  outrasDespesasAnuais,
} from '@/lib/lancamentos';
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
import SectionCard from '@/components/Custos/SectionCard';

interface PremissasDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PremissasDrawer({ open, onOpenChange }: PremissasDrawerProps) {
  const premissas = useStore((s) => s.activePremissas);
  const custos = useStore((s) => s.activeCustos);
  const updatePremissas = useStore((s) => s.updatePremissas);
  const setReceitaVenda = useStore((s) => s.setReceitaVenda);

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

  const localCustoRacao = custoRacaoAnual(localCustos.lancamentos);
  const localCustoMaoObra = custoMaoObraAnual(localCustos.lancamentos);
  const localOutrasDespesas = outrasDespesasAnuais(localCustos.lancamentos);

  const handleSave = () => {
    updatePremissas(localPremissas);
    setReceitaVenda(localCustos.receita_venda);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const lucro = localCustos.receita_venda - localCustoRacao - localCustoMaoObra - localOutrasDespesas;
  const margemLucro = localCustos.receita_venda > 0
    ? ((lucro / localCustos.receita_venda) * 100).toFixed(1)
    : '0';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] sm:!w-[min(720px,calc(100vw-2rem))] sm:!max-w-3xl flex flex-col h-full p-0 bg-muted/40"
      >
        <SheetHeader className="px-4 pt-5 pb-3 shrink-0 bg-white border-b border-border/60 sm:px-5">
          <div className="flex min-w-0 items-center gap-3 pr-8">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm sm:h-10 sm:w-10">
              <Settings className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base font-bold leading-tight text-foreground sm:text-lg">
                Premissas & Configurações
              </SheetTitle>
              <SheetDescription className="text-xs text-foreground/70 font-medium">
                Parâmetros globais de produção e financeiros
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 sm:px-4 sm:py-2 sm:space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            <SectionCard title="Parâmetros de Produção" icon={Settings}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <p className="text-xs text-muted-foreground">
                  Custos de ração, mão de obra e outros agora são registrados como{' '}
                  <span className="font-semibold">Lançamentos</span> na página de Custos.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Resultado Estimado" icon={DollarSign}>
              <div className="space-y-3">
                <div className="flex min-w-0 items-start justify-between gap-3 py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Receita Total</span>
                  <span className="min-w-0 text-right text-sm font-semibold text-emerald-600 break-words">
                    R$ {localCustos.receita_venda.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-3 py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Custo Ração</span>
                  <span className="min-w-0 text-right text-sm font-semibold text-red-600 break-words">
                    − R$ {localCustoRacao.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-3 py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Mão de Obra</span>
                  <span className="min-w-0 text-right text-sm font-semibold text-red-600 break-words">
                    − R$ {localCustoMaoObra.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-3 py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Outros Custos</span>
                  <span className="min-w-0 text-right text-sm font-semibold text-red-600 break-words">
                    − R$ {localOutrasDespesas.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-3 pt-2">
                  <span className="text-sm font-bold text-foreground font-heading">
                    Lucro Estimado/Ano
                  </span>
                  <div className="min-w-0 text-right">
                    <p className={cn('text-base font-bold font-heading break-words sm:text-lg', lucro >= 0 ? 'text-emerald-600' : 'text-red-600')}>
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

        <SheetFooter className="px-3 pb-3 pt-2 shrink-0 sm:px-4 sm:pb-4">
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
