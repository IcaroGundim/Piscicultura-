'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function SaveStatus() {
  const saveStatus = useStore((s) => s.saveStatus);

  // Evita divergência de hidratação no cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

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

  return null;
}
