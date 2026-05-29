'use client';

import { Check, CloudCheck, Loader2 } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function SaveIndicator({ status }: { status: SaveStatus }) {
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
