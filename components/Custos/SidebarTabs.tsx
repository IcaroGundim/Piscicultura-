'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarTab {
  id: string;
  label: string;
}

interface SidebarTabsProps {
  tabs: SidebarTab[];
  defaultTab?: string;
  children: (activeId: string) => ReactNode;
}

export default function SidebarTabs({ tabs, defaultTab, children }: SidebarTabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className="space-y-3">
      <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div>{children(active)}</div>
    </div>
  );
}
