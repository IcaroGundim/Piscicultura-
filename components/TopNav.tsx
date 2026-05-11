'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Droplets, Database, Settings, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import PremissasDialog from './PremissasDialog';

const navItems = [
  { href: '/', label: 'Visão Geral', icon: Home },
  { href: '/financeiro', label: 'Dados', icon: Database },
];

export default function TopNav() {
  const pathname = usePathname();
  const [generating, setGenerating] = useState(false);
  const [premissasOpen, setPremissasOpen] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { generateReport } = await import('@/lib/generateReport');
      const state = useStore.getState();
      generateReport({
        tanks: state.tanks,
        bercarioLotes: state.bercarioLotes,
        recriaLotes: state.recriaLotes,
        engordaLotes: state.engordaLotes,
        premissas: state.premissas,
        custos: state.custos,
      });
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="flex h-16 items-center px-6">
          {/* Logo area */}
          <div className="flex items-center gap-3 mr-8 pr-6 border-r border-border/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary shadow-sm shadow-primary/20 shrink-0">
              <Droplets className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="hidden text-base lg:text-lg font-bold tracking-tight text-foreground sm:block">
                Painel de Gerenciamento de Tanques
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest hidden sm:block">
                  Controle
                </span>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav role="navigation" className="flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 min-h-[44px]',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="hidden md:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Spacer  */}
          <div className="flex-1" />

          {/* Settings button */}
          <button
            type="button"
            onClick={() => setPremissasOpen(true)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 min-h-[44px]',
              'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
            )}
            aria-label="Abrir configurações"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:block">Configurações</span>
          </button>

          {/* Generate Report button */}
          <button
            id="btn-generate-report"
            onClick={handleGenerateReport}
            disabled={generating}
            aria-busy={generating}
            aria-live="polite"
            aria-label={generating ? undefined : 'Gerar relatório PDF'}
            aria-haspopup="menu"
            className={cn(
              'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px]',
              'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20',
              'hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 hover:-translate-y-0.5',
              'active:translate-y-0 active:shadow-sm',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm'
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
      <PremissasDialog open={premissasOpen} onOpenChange={setPremissasOpen} />
    </>
  );
}
