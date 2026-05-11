'use client';

import StatsBar from '@/components/StatsBar';
import KanbanBoard from '@/components/KanbanBoard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Dashboard() {
  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col px-4 py-4 lg:px-6">
      {/* KPI bar */}
      <div className="mb-3 shrink-0">
        <StatsBar />
      </div>

      {/* Kanban Board */}
      <ErrorBoundary>
        <div className="min-h-0 flex-1">
          <KanbanBoard />
        </div>
      </ErrorBoundary>
    </div>
  );
}
