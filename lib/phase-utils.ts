import type { TankPhase } from './types';

export const getPhaseBorderColor = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'border-blue-200/90 hover:border-blue-300';
    case 'recria':
      return 'border-emerald-200/90 hover:border-emerald-300';
    case 'engorda':
      return 'border-orange-200/90 hover:border-orange-300';
    case 'vazio':
      return 'border-slate-200 hover:border-slate-300';
  }
};

export const getPhaseGlowColor = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'hover:shadow-[0_10px_24px_rgba(59,130,246,0.14)]';
    case 'recria':
      return 'hover:shadow-[0_10px_24px_rgba(16,185,129,0.14)]';
    case 'engorda':
      return 'hover:shadow-[0_10px_24px_rgba(249,115,22,0.14)]';
    case 'vazio':
      return 'hover:shadow-[0_10px_20px_rgba(100,116,139,0.12)]';
  }
};

export const getPhaseSelectedBg = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'bg-blue-50/80';
    case 'recria':
      return 'bg-emerald-50/80';
    case 'engorda':
      return 'bg-orange-50/80';
    case 'vazio':
      return 'bg-slate-50/90';
  }
};

export const getPhaseTopAccent = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'from-blue-500/80';
    case 'recria':
      return 'from-emerald-500/80';
    case 'engorda':
      return 'from-orange-500/80';
    case 'vazio':
      return 'from-slate-400/80';
  }
};

export const getPhaseDotColor = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'bg-blue-500';
    case 'recria':
      return 'bg-green-500';
    case 'engorda':
      return 'bg-amber-500';
    case 'vazio':
      return 'bg-slate-400';
  }
};

export const getPhaseBadgeClasses = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'border-blue-200/80 bg-blue-50/80 text-blue-700';
    case 'recria':
      return 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700';
    case 'engorda':
      return 'border-orange-200/80 bg-orange-50/80 text-orange-700';
    case 'vazio':
      return 'border-slate-200/90 bg-slate-100/90 text-slate-600';
  }
};
