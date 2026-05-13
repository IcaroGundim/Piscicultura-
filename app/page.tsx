'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import KanbanBoard from '@/components/KanbanBoard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import TankPopover from '@/components/TankPopover';
import { Eye, EyeOff, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const PremissasDrawer = dynamic(() => import('@/components/PremissasDrawer'), {
  ssr: false,
});

export default function Dashboard() {
  const [premissasDrawerOpen, setPremissasDrawerOpen] = useState(false);
  const [showVazio, setShowVazio] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col px-4 py-4 lg:px-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h1 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Tanques
          </h1>
          <p className="text-xs text-muted-foreground">
            Gerencie os tanques do projeto
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <TankPopover />
          <button
            type="button"
            onClick={() => setPremissasDrawerOpen(true)}
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
          <button
            type="button"
            onClick={() => setShowVazio((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 min-h-[40px]',
              showVazio
                ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/30 hover:shadow-sm hover:shadow-primary/10'
                : 'bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80',
              'active:scale-95'
            )}
            title={showVazio ? 'Ocultar coluna Vazio' : 'Mostrar coluna Vazio'}
          >
            {showVazio ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">Vazio</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <ErrorBoundary>
        <div className="min-h-0 flex-1">
          <KanbanBoard showVazio={showVazio} />
        </div>
      </ErrorBoundary>

      {/* Premissas Drawer */}
      <PremissasDrawer
        open={premissasDrawerOpen}
        onOpenChange={setPremissasDrawerOpen}
      />
    </div>
  );
}
