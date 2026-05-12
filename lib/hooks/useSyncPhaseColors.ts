'use client';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

function hexToRgbTuple(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return '0, 0, 0';
  }
  return `${r}, ${g}, ${b}`;
}

export function useSyncPhaseColors() {
  const phaseColors = useStore((s) => s.phaseColors);
  useEffect(() => {
    const root = document.documentElement;
    (Object.entries(phaseColors) as [string, string][]).forEach(([phase, hex]) => {
      if (!HEX6.test(hex)) return;
      root.style.setProperty(`--phase-${phase}`, hex);
      root.style.setProperty(`--phase-${phase}-rgb`, hexToRgbTuple(hex));
    });
  }, [phaseColors]);
}
