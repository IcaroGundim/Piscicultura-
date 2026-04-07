'use client';

import { useRef } from 'react';
import type { Tank } from '@/lib/types';
import { cn } from '@/lib/utils';
import PhaseBadge from './PhaseBadge';
import { Droplets } from 'lucide-react';

interface TankCardProps {
  tank: Tank;
  isSelected?: boolean;
  onClick: () => void;
  animationDelay?: number;
}

const phaseBorderColors: Record<string, string> = {
  bercario: 'border-blue-200/90 hover:border-blue-300',
  recria:   'border-emerald-200/90 hover:border-emerald-300',
  engorda:  'border-orange-200/90 hover:border-orange-300',
  vazio:    'border-slate-200 hover:border-slate-300',
};

const phaseGlowColors: Record<string, string> = {
  bercario: 'hover:shadow-[0_10px_24px_rgba(59,130,246,0.14)]',
  recria:   'hover:shadow-[0_10px_24px_rgba(16,185,129,0.14)]',
  engorda:  'hover:shadow-[0_10px_24px_rgba(249,115,22,0.14)]',
  vazio:    'hover:shadow-[0_10px_20px_rgba(100,116,139,0.12)]',
};

const phaseSelectedBg: Record<string, string> = {
  bercario: 'bg-blue-50/80',
  recria:   'bg-emerald-50/80',
  engorda:  'bg-orange-50/80',
  vazio:    'bg-slate-50/90',
};

const phaseTopAccent: Record<string, string> = {
  bercario: 'from-blue-500/80',
  recria:   'from-emerald-500/80',
  engorda:  'from-orange-500/80',
  vazio:    'from-slate-400/80',
};

export default function TankCard({
  tank,
  isSelected,
  onClick,
  animationDelay = 0,
}: TankCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = cardRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    }
    onClick();
  };

  return (
    <button
      ref={cardRef}
      onClick={handleClick}
      className={cn(
        'ripple-container w-full cursor-pointer rounded-2xl border text-left transition-all duration-300',
        'tank-card-enter group overflow-hidden',
        'bg-card/95 backdrop-blur-sm',
        phaseBorderColors[tank.phase],
        phaseGlowColors[tank.phase],
        isSelected && [
          phaseSelectedBg[tank.phase],
          'scale-[1.01] ring-1 shadow-md',
          tank.phase === 'bercario' ? 'ring-blue-300 shadow-blue-100/80' :
          tank.phase === 'recria'   ? 'ring-emerald-300 shadow-emerald-100/80' :
          tank.phase === 'engorda'  ? 'ring-orange-300 shadow-orange-100/80' : 'ring-slate-300 shadow-slate-100/80',
        ]
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={cn('h-[2px] w-full bg-gradient-to-r to-transparent', phaseTopAccent[tank.phase])} />

      <div className="p-2.5 sm:p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex flex-col">
            <span
              className="text-sm font-bold text-slate-800 leading-none"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              T{tank.id.toString().padStart(2, '0')}
            </span>
            {tank.subfase && (
              <span className="mt-1 block max-w-[100px] truncate text-[10px] text-slate-500" title={tank.subfase}>
                {tank.subfase}
              </span>
            )}
          </div>
          <PhaseBadge phase={tank.phase} size="sm" />
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <Droplets className="h-3 w-3 text-blue-600/70" />
          <span className="text-[11px] font-medium text-slate-600">{tank.area_m2.toLocaleString('pt-BR')} m²</span>
        </div>
      </div>
    </button>
  );
}
