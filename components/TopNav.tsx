'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Waves, Database, FileText, FileSpreadsheet, Loader2, ChevronDown, MapPin, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { LOCATION_LABELS } from '@/lib/types';
import type { LocationKey } from '@/lib/types';
import PhaseColorConfig from './PhaseColorConfig';

const navItems = [
  { href: '/', label: 'Tanques', icon: Waves },
  { href: '/financeiro', label: 'Dados', icon: Database },
];

export default function TopNav() {
  const pathname = usePathname();
  const activeLocation = useStore((s) => s.activeLocation);
  const setLocation = useStore((s) => s.setLocation);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const [locationOpen, setLocationOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openDropdown = useCallback(() => {
    setDropdownVisible(true);
    setIsAnimating(true);
    setLocationOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsAnimating(true);
    setLocationOpen(false);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
    if (!locationOpen) {
      setDropdownVisible(false);
    }
  }, [locationOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    if (locationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [locationOpen, closeDropdown]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { generateReport } = await import('@/lib/generateReport');
      const state = useStore.getState();
      generateReport({
        tanks: state.activeTanks,
        bercarioLotes: state.activeBercarioLotes,
        recriaLotes: state.activeRecriaLotes,
        engordaLotes: state.activeEngordaLotes,
        premissas: state.activePremissas,
        locationName: LOCATION_LABELS[state.activeLocation as LocationKey],
      });
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportSpreadsheet = async () => {
    setExporting(true);
    try {
      const { generateSpreadsheet } = await import('@/lib/generateSpreadsheet');
      const state = useStore.getState();
      await generateSpreadsheet({
        tanks: state.activeTanks,
        bercarioLotes: state.activeBercarioLotes,
        recriaLotes: state.activeRecriaLotes,
        engordaLotes: state.activeEngordaLotes,
        premissas: state.activePremissas,
        locationName: LOCATION_LABELS[state.activeLocation as LocationKey],
      });
    } catch (err) {
      console.error('Erro ao exportar planilha:', err);
      alert('Erro ao exportar planilha. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#165a64]/30 bg-[#1d5e69] backdrop-blur-md">
        <div className="flex h-16 items-center px-6 bg-[#1d5e69] text-white">
          {/* Logo area */}
          <div className="flex items-center mr-8 pr-6 border-r border-white/20">
            <div className="flex flex-col">
              <h1 className="hidden text-base lg:text-lg font-bold tracking-tight text-white sm:block">
                Manati
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-medium text-white/70 uppercase tracking-widest hidden sm:block">
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
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-white/70')} />
                  <span className="hidden md:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Location + Configuração (grouped) */}
          <div className="ml-3 flex items-center gap-2 shrink-0">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => (locationOpen ? closeDropdown() : openDropdown())}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer min-h-[44px]',
                  'bg-white/15 text-white border border-white/25 hover:bg-white/25'
                )}
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden md:block">{LOCATION_LABELS[activeLocation as LocationKey]}</span>
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform duration-200', locationOpen && 'rotate-180')}
                />
              </button>
              {(dropdownVisible || isAnimating) && (
                <div
                  onAnimationEnd={handleAnimationEnd}
                  className={cn(
                    'absolute top-full left-0 mt-1 w-40 rounded-lg border border-white/20 bg-[#1a4f58] shadow-lg shadow-black/20 overflow-hidden z-50',
                    'origin-top-left',
                    locationOpen
                      ? 'animate-[dropdown-in_200ms_ease-out_forwards]'
                      : 'animate-[dropdown-out_150ms_ease-in_forwards]'
                  )}
                >
                  {(Object.keys(LOCATION_LABELS) as LocationKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setLocation(key);
                        closeDropdown();
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer',
                        activeLocation === key
                          ? 'bg-white/20 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <MapPin
                        className={cn('h-3.5 w-3.5', activeLocation === key ? 'text-white' : 'text-white/50')}
                      />
                      {LOCATION_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer min-h-[44px]',
                'bg-white/15 text-white border border-white/25 hover:bg-white/25'
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:block">Configuração</span>
            </button>
          </div>

          {/* Spacer  */}
          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-export-spreadsheet"
              onClick={handleExportSpreadsheet}
              disabled={exporting}
              aria-busy={exporting}
              aria-live="polite"
              aria-label={exporting ? undefined : 'Exportar planilha XLSX'}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px]',
                'bg-white text-[#1d5e69] border-white/80 shadow-sm shadow-black/10 ring-1 ring-inset ring-black/5',
                'hover:bg-white/90 hover:border-white hover:shadow-md hover:shadow-black/10',
                'active:bg-white active:shadow-sm',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm'
              )}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span className="hidden sm:block">{exporting ? 'Exportando...' : 'Exportar Planilha'}</span>
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
                'bg-white text-[#1d5e69] border-white/80 shadow-sm shadow-black/10 ring-1 ring-inset ring-black/5',
                'hover:bg-white/90 hover:border-white hover:shadow-md hover:shadow-black/10',
                'active:bg-white active:shadow-sm',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm'
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
        </div>
      </header>
      <PhaseColorConfig open={configOpen} onOpenChange={setConfigOpen} />
    </>
  );
}
