'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { TankPhase } from '@/lib/types';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASE_OPTIONS: { value: TankPhase; label: string }[] = [
  { value: 'vazio', label: 'Vazio' },
  { value: 'bercario', label: 'Berçário' },
  { value: 'recria', label: 'Recria' },
  { value: 'engorda', label: 'Engorda' },
];

export default function TankPopover() {
  const [open, setOpen] = useState(false);
  const [areaM2, setAreaM2] = useState<number>(0);
  const [phase, setPhase] = useState<TankPhase>('vazio');
  const [subfase, setSubfase] = useState('');

  const tanks = useStore((s) => s.activeTanks);
  const addTank = useStore((s) => s.addTank);

  const areaHa = areaM2 > 0 ? Math.round((areaM2 / 10000) * 10000) / 10000 : 0;

  const resetForm = () => {
    setAreaM2(0);
    setPhase('vazio');
    setSubfase('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (areaM2 <= 0) return;

    const nextId = tanks.length > 0 ? Math.max(...tanks.map((t) => t.id), 0) + 1 : 1;

    addTank({
      id: nextId,
      area_m2: areaM2,
      area_ha: areaHa,
      phase,
      subfase: subfase.trim() || undefined,
    });

    resetForm();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 min-h-[40px]',
              'bg-[#1d5e69] text-white border border-[#165a64]/40 shadow-sm shadow-[#1d5e69]/20',
              'hover:bg-[#19525c] hover:shadow-md hover:shadow-[#1d5e69]/25',
              'active:scale-95'
            )}
          />
        }
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo Tanque</span>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <form onSubmit={handleSubmit} className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Novo Tanque</h3>

          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground uppercase tracking-wider">
              Área <span className="text-muted-foreground/70 normal-case">(m²)</span>
            </label>
            <input
              type="number"
              step="100"
              min={0}
              value={areaM2 || ''}
              onChange={(e) => setAreaM2(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 5000"
              aria-label="Área do tanque em metros quadrados"
              className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            />
            {areaM2 > 0 && (
              <p className="text-xs text-muted-foreground">{areaHa} ha</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground uppercase tracking-wider">
              Fase inicial
            </label>
            <Select value={phase} onValueChange={(v) => setPhase(v as TankPhase)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground uppercase tracking-wider">
              Subfase <span className="text-muted-foreground/70 normal-case">(opcional)</span>
            </label>
            <input
              type="text"
              value={subfase}
              onChange={(e) => setSubfase(e.target.value)}
              placeholder="Ex: Módulo 1"
              aria-label="Subfase do tanque (opcional)"
              className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={areaM2 <= 0}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 w-full min-h-[40px]',
              'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Plus className="w-4 h-4" />
            Adicionar Tanque
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
