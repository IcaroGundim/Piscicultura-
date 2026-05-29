'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Waves, Database, FileText, FileSpreadsheet, Loader2, ChevronDown, MapPin, Settings, MoreVertical, DollarSign, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { LOCATION_LABELS } from '@/lib/types';
import type { LocationKey } from '@/lib/types';

const PhaseColorConfig = dynamic(() => import('./PhaseColorConfig'), {
  ssr: false,
});

const navItems = [
  { href: '/', label: 'Tanques', icon: Waves },
  { href: '/financeiro', label: 'Dados', icon: Database },
  { href: '/custos', label: 'Custos', icon: DollarSign },
];

const MONTH_LABELS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_LABELS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function TopNav() {
  const pathname = usePathname();
  const activeLocation = useStore((s) => s.activeLocation);
  const setLocation = useStore((s) => s.setLocation);
  const viewPeriod = useStore((s) => s.viewPeriod);
  const setViewPeriod = useStore((s) => s.setViewPeriod);
  const referenceMonth = useStore((s) => s.referenceMonth);
  const referenceYear = useStore((s) => s.referenceYear);
  const setReferenceMonth = useStore((s) => s.setReferenceMonth);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const [locationOpen, setLocationOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuAnimating, setActionMenuAnimating] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

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

  const openActionMenu = useCallback(() => {
    setActionMenuVisible(true);
    setActionMenuAnimating(true);
    setActionMenuOpen(true);
  }, []);

  const closeActionMenu = useCallback(() => {
    setActionMenuAnimating(true);
    setActionMenuOpen(false);
  }, []);

  const handleActionMenuAnimationEnd = useCallback(() => {
    setActionMenuAnimating(false);
    if (!actionMenuOpen) {
      setActionMenuVisible(false);
    }
  }, [actionMenuOpen]);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        closeActionMenu();
      }
    }
    if (actionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [actionMenuOpen, closeActionMenu]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setMonthPickerOpen(false);
      }
    }
    if (monthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [monthPickerOpen]);

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
        <div className="flex h-14 items-center gap-1.5 px-3 bg-[#1d5e69] text-white md:h-16 md:gap-0 md:px-6">
          {/* Logo area */}
          <div className="flex items-center pr-2 border-r border-white/20 md:mr-8 md:pr-6">
            <div className="flex flex-col">
              <h1 className="text-sm font-bold tracking-tight text-white sm:text-base lg:text-lg">
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
          <nav role="navigation" className="flex items-center gap-1 md:space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200 min-h-[40px] min-w-[40px] md:min-h-[44px] md:min-w-0 md:px-3',
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

          {/* Perspectiva temporal */}
          <div className="ml-3 hidden items-center gap-1.5 shrink-0 lg:flex" role="radiogroup" aria-label="Perspectiva temporal">
            <div className="flex items-center rounded-xl border border-white/25 bg-white/10 p-0.5">
              {(['anual', 'mensal'] as const).map((period) => {
                const active = viewPeriod === period;
                return (
                  <button
                    key={period}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setViewPeriod(period)}
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer min-h-[32px]',
                      active
                        ? 'bg-white text-[#1d5e69] shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {period}
                  </button>
                );
              })}
            </div>

            {viewPeriod === 'mensal' && (
              <div className="relative" ref={monthPickerRef}>
                <button
                  type="button"
                  onClick={() => setMonthPickerOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all min-h-[36px] cursor-pointer"
                  aria-label={`Mês de referência: ${MONTH_LABELS_FULL[referenceMonth]} ${referenceYear}`}
                  aria-expanded={monthPickerOpen}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="tabular-nums">
                    {MONTH_LABELS_SHORT[referenceMonth]}/{referenceYear}
                  </span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform', monthPickerOpen && 'rotate-180')} />
                </button>

                {monthPickerOpen && (
                  <div className="absolute top-full right-0 mt-1 w-56 rounded-lg border border-white/20 bg-[#1a4f58] p-2 shadow-lg z-50">
                    {/* Year stepper */}
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-white/10 mb-2">
                      <button
                        type="button"
                        onClick={() => setReferenceMonth(referenceYear - 1, referenceMonth)}
                        className="rounded px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 cursor-pointer"
                      >
                        ◂
                      </button>
                      <span className="text-sm font-bold text-white tabular-nums">{referenceYear}</span>
                      <button
                        type="button"
                        onClick={() => setReferenceMonth(referenceYear + 1, referenceMonth)}
                        className="rounded px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 cursor-pointer"
                      >
                        ▸
                      </button>
                    </div>
                    {/* Months grid */}
                    <div className="grid grid-cols-3 gap-1">
                      {MONTH_LABELS_SHORT.map((label, idx) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setReferenceMonth(referenceYear, idx);
                            setMonthPickerOpen(false);
                          }}
                          className={cn(
                            'rounded px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                            referenceMonth === idx
                              ? 'bg-white text-[#1d5e69]'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location + Configuração (grouped) */}
          <div className="ml-3 flex items-center gap-2 shrink-0">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => (locationOpen ? closeDropdown() : openDropdown())}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition-all duration-200 cursor-pointer min-h-[40px] md:min-h-[44px] md:gap-2 md:px-3',
                  'bg-white/15 text-white border border-white/25 hover:bg-white/25'
                )}
                aria-label={`Selecionar local: ${LOCATION_LABELS[activeLocation as LocationKey]}`}
              >
                <MapPin className="h-4 w-4" />
                <span className="max-w-[3.75rem] truncate text-xs sm:max-w-[4.5rem] sm:text-sm md:max-w-none md:text-sm">
                  {LOCATION_LABELS[activeLocation as LocationKey]}
                </span>
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform duration-200', locationOpen && 'rotate-180')}
                />
              </button>
              {(dropdownVisible || isAnimating) && (
                <div
                  onAnimationEnd={handleAnimationEnd}
                  className={cn(
                    'absolute top-full right-0 mt-1 w-40 rounded-lg border border-white/20 bg-[#1a4f58] shadow-lg shadow-black/20 overflow-hidden z-50 md:left-0 md:right-auto',
                    'origin-top-right md:origin-top-left',
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
                'hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer min-h-[44px] md:flex',
                'bg-white/15 text-white border border-white/25 hover:bg-white/25'
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:block">Configuração</span>
            </button>
          </div>

          {/* Spacer  */}
          <div className="flex-1" />

          <div className="hidden items-center gap-2 shrink-0 md:flex">
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

          <div className="relative shrink-0 md:hidden" ref={actionMenuRef}>
            <button
              type="button"
              onClick={() => (actionMenuOpen ? closeActionMenu() : openActionMenu())}
              className={cn(
                'flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border px-2.5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
                'bg-white text-[#1d5e69] border-white/80 shadow-sm shadow-black/10 ring-1 ring-inset ring-black/5',
                'hover:bg-white/90 active:bg-white'
              )}
              aria-label="Abrir menu de ações"
              aria-expanded={actionMenuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {(actionMenuVisible || actionMenuAnimating) && (
              <div
                role="menu"
                onAnimationEnd={handleActionMenuAnimationEnd}
                className={cn(
                  'absolute top-full right-0 mt-1 w-56 rounded-lg border border-white/20 bg-[#1a4f58] shadow-lg shadow-black/20 overflow-hidden z-50',
                  'origin-top-right',
                  actionMenuOpen
                    ? 'animate-[dropdown-in_200ms_ease-out_forwards]'
                    : 'animate-[dropdown-out_150ms_ease-in_forwards]'
                )}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeActionMenu();
                    setConfigOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/80 transition-colors cursor-pointer hover:bg-white/10 hover:text-white"
                >
                  <Settings className="h-4 w-4 text-white/60" />
                  Configuração
                </button>
                <button
                  id="btn-export-spreadsheet-mobile"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeActionMenu();
                    void handleExportSpreadsheet();
                  }}
                  disabled={exporting}
                  aria-busy={exporting}
                  aria-live="polite"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/80 transition-colors cursor-pointer hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 text-white/60" />
                  )}
                  {exporting ? 'Exportando...' : 'Exportar Planilha'}
                </button>
                <button
                  id="btn-generate-report-mobile"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeActionMenu();
                    void handleGenerateReport();
                  }}
                  disabled={generating}
                  aria-busy={generating}
                  aria-live="polite"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/80 transition-colors cursor-pointer hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                  ) : (
                    <FileText className="h-4 w-4 text-white/60" />
                  )}
                  {generating ? 'Gerando...' : 'Gerar Relatório'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <PhaseColorConfig open={configOpen} onOpenChange={setConfigOpen} />
    </>
  );
}
