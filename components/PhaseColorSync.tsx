'use client';

import { useSyncPhaseColors } from '@/lib/hooks/useSyncPhaseColors';

export function PhaseColorSync() {
  useSyncPhaseColors();
  return null;
}
