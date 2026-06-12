'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { useStore } from '@/lib/store';

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function SaveStatus() {
  const saveStatus = useStore((s) => s.saveStatus);
  const updatedAt = useStore((s) => s.updatedAt);

  // Evita divergência de hidratação ao formatar horário no cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (saveStatus === 'saving') {
    return (
      <span
        className="flex items-center gap-1.5 text-xs font-medium text-white/70"
        aria-live="polite"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Salvando…</span>
      </span>
    );
  }

  if (saveStatus === 'error') {
    return (
      <span
        className="flex items-center gap-1.5 text-xs font-medium text-amber-200"
        role="status"
        aria-live="assertive"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Erro ao salvar</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="underline underline-offset-2 hover:text-white cursor-pointer"
        >
          Recarregar
        </button>
      </span>
    );
  }

  const time = formatTime(updatedAt);
  if (saveStatus === 'saved' || time) {
    return (
      <span
        className="flex items-center gap-1.5 text-xs font-medium text-white/60"
        aria-live="polite"
      >
        <Check className="h-3.5 w-3.5" />
        <span>{time ? `Salvo às ${time}` : 'Salvo'}</span>
      </span>
    );
  }

  return null;
}
