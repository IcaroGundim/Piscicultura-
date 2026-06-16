import type { TankPhase } from './types';

export const getPhaseBorderColor = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'border-(--phase-bercario)/55 hover:border-(--phase-bercario)';
    case 'recria':
      return 'border-(--phase-recria)/35 hover:border-(--phase-recria)/55';
    case 'engorda':
      return 'border-(--phase-engorda)/45 hover:border-(--phase-engorda)';
    case 'vazio':
      return 'border-zinc-200 hover:border-zinc-300';
  }
};

export const getPhaseGlowColor = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'hover:shadow-[0_10px_24px_rgba(var(--phase-bercario-rgb),0.28)]';
    case 'recria':
      return 'hover:shadow-[0_10px_24px_rgba(var(--phase-recria-rgb),0.16)]';
    case 'engorda':
      return 'hover:shadow-[0_10px_24px_rgba(var(--phase-engorda-rgb),0.22)]';
    case 'vazio':
      return 'hover:shadow-[0_10px_20px_rgba(var(--phase-vazio-rgb),0.12)]';
  }
};

export const getPhaseSelectedBg = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'bg-(--phase-bercario)/16';
    case 'recria':
      return 'bg-(--phase-recria)/08';
    case 'engorda':
      return 'bg-(--phase-engorda)/10';
    case 'vazio':
      return 'bg-zinc-50/90';
  }
};

export const getPhaseTopAccent = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'bg-(--phase-bercario)/80';
    case 'recria':
      return 'bg-(--phase-recria)/75';
    case 'engorda':
      return 'bg-(--phase-engorda)/78';
    case 'vazio':
      return 'bg-zinc-500/70';
  }
};

export const getPhaseDotColor = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'bg-(--phase-bercario)';
    case 'recria':
      return 'bg-(--phase-recria)';
    case 'engorda':
      return 'bg-(--phase-engorda)';
    case 'vazio':
      return 'bg-zinc-500';
  }
};

export const getPhaseHoverBg = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'hover:bg-(--phase-bercario)/16';
    case 'recria':
      return 'hover:bg-(--phase-recria)/08';
    case 'engorda':
      return 'hover:bg-(--phase-engorda)/10';
    case 'vazio':
      return 'hover:bg-zinc-50/90';
  }
};

export const getPhaseTextColor = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'text-(--phase-bercario)';
    case 'recria':
      return 'text-(--phase-recria)';
    case 'engorda':
      return 'text-(--phase-engorda)';
    case 'vazio':
      return 'text-zinc-500';
  }
};

export const getPhaseBadgeClasses = (phase: TankPhase): string => {
  switch (phase) {
    case 'bercario':
      return 'border-(--phase-bercario)/50 bg-(--phase-bercario)/15 text-[#2d4518]';
    case 'recria':
      return 'border-(--phase-recria)/35 bg-(--phase-recria)/10 text-(--phase-recria)';
    case 'engorda':
      return 'border-(--phase-engorda)/40 bg-(--phase-engorda)/10 text-[#1e3a8a]';
    case 'vazio':
      return 'border-zinc-200/90 bg-zinc-100/90 text-zinc-600';
  }
};
