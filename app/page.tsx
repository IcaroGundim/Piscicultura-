'use client';

import KanbanBoard from '@/components/KanbanBoard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import TankPopover from '@/components/TankPopover';

export default function Dashboard() {
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
        </div>
      </div>

      {/* Kanban Board */}
      <ErrorBoundary>
        <div className="min-h-0 flex-1">
          <KanbanBoard showVazio={false} />
        </div>
      </ErrorBoundary>
    </div>
  );
}
