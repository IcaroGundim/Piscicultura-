'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Fish, Droplets, Database, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

const navItems = [
  { href: '/', label: 'Visão Geral', icon: Home },
  { href: '/financeiro', label: 'Dados', icon: Database },
];

export default function TopNav() {
  const pathname = usePathname();
  const [generating, setGenerating] = useState(false);

  const store = useStore();

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { generateReport } = await import('@/lib/generateReport');
      generateReport({
        tanks: store.tanks,
        bercarioLotes: store.bercarioLotes,
        recriaLotes: store.recriaLotes,
        engordaLotes: store.engordaLotes,
        premissas: store.premissas,
        custos: store.custos,
      });
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center px-6">
        {/* Logo area */}
        <div className="flex items-center gap-3 mr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/25 shrink-0">
            <Droplets className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="hidden text-base lg:text-lg font-bold tracking-tight text-slate-900 sm:block" style={{ fontFamily: 'var(--font-syne)' }}>
              Painel de Gerenciamento de Tanques
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest hidden sm:block">
                Controle
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex items-center space-x-1 lg:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'border-blue-200 bg-blue-50/90 text-blue-700 shadow-sm shadow-blue-200/60' 
                    : 'border-transparent text-slate-600 hover:border-border hover:bg-card hover:text-slate-900 hover:shadow-sm'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-blue-700' : 'text-slate-500')} />
                <span className="hidden md:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer  */}
        <div className="flex-1" />

        {/* Generate Report button */}
        <button
          id="btn-generate-report"
          onClick={handleGenerateReport}
          disabled={generating}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer',
            'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white shadow-md shadow-blue-600/25',
            'hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5',
            'active:translate-y-0 active:shadow-sm',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md'
          )}
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span className="hidden sm:block">{generating ? 'Gerando...' : 'Gerar Relatório'}</span>
        </button>
      </div>
    </header>
  );
}
