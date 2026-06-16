'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useStore } from '@/lib/store';
import type { TankPhase } from '@/lib/types';
import { PHASE_LABELS } from '@/lib/types';
import { RotateCcw } from 'lucide-react';

const DEFAULT_COLORS: Record<TankPhase, string> = {
  bercario: '#94ba65',
  recria: '#cd5c5c',
  engorda: '#2563eb',
  vazio: '#52525b',
};

const PHASES: TankPhase[] = ['bercario', 'recria', 'engorda', 'vazio'];

interface PhaseColorConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PhaseColorConfig({ open, onOpenChange }: PhaseColorConfigProps) {
  const phaseColors = useStore((s) => s.phaseColors);
  const setPhaseColor = useStore((s) => s.setPhaseColor);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] sm:!w-[420px] sm:!max-w-[420px] flex flex-col h-full p-0 bg-white"
      >
        <SheetHeader className="px-4 pt-5 pb-3 shrink-0 border-b border-border/60 sm:px-5">
          <SheetTitle className="pr-8 text-base font-bold text-foreground sm:text-lg">
            Configuração de Cores
          </SheetTitle>
          <p className="pr-8 text-xs text-muted-foreground mt-1">
            Personalize as cores de cada fase de produção
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:px-5">
          {PHASES.map((phase) => (
            <div key={phase} className="space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg shrink-0 border border-black/10"
                  style={{ backgroundColor: phaseColors[phase] }}
                />
                <span className="text-sm font-medium text-foreground">
                  {PHASE_LABELS[phase]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={phaseColors[phase]}
                  onChange={(e) => setPhaseColor(phase, e.target.value)}
                  className="w-10 h-10 shrink-0 rounded-lg cursor-pointer border border-border/50 p-0.5"
                />
                <input
                  type="text"
                  value={phaseColors[phase]}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                      setPhaseColor(phase, v);
                    }
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-border/50 px-3 py-2 text-sm font-mono text-foreground bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setPhaseColor(phase, DEFAULT_COLORS[phase])}
                  className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Restaurar cor padrão"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Pré-visualização
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PHASES.map((phase) => (
                <div key={phase} className="min-w-0 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full h-12 rounded-lg"
                    style={{ backgroundColor: phaseColors[phase] }}
                  />
                  <span className="max-w-full truncate text-xs text-muted-foreground">
                    {PHASE_LABELS[phase]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
