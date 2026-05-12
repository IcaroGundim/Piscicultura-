import { initialLocations } from './initialData';
import { PHASE_COLORS } from './types';
import type {
  Custos,
  EngordaLote,
  LocationData,
  LocationKey,
  Premissas,
  RecriaLote,
  Tank,
  TankPhase,
  BercarioLote,
} from './types';

export interface ProjectStateSnapshot {
  activeLocation: LocationKey;
  locations: Record<LocationKey, LocationData>;
  phaseColors: Record<TankPhase, string>;
}

export interface ProjectDerivedState {
  activeTanks: Tank[];
  activeBercarioLotes: BercarioLote[];
  activeRecriaLotes: RecriaLote[];
  activeEngordaLotes: EngordaLote[];
  activePremissas: Premissas;
  activeCustos: Custos;
}

export const DEFAULT_PHASE_COLORS: Record<TankPhase, string> = {
  ...PHASE_COLORS,
};

export function createDefaultProjectState(): ProjectStateSnapshot {
  return {
    activeLocation: 'rondonia',
    locations: structuredClone(initialLocations) as Record<LocationKey, LocationData>,
    phaseColors: { ...DEFAULT_PHASE_COLORS },
  };
}

export function normalizeProjectState(
  snapshot?: Partial<ProjectStateSnapshot> | null
): ProjectStateSnapshot {
  const defaults = createDefaultProjectState();
  const activeLocation = snapshot?.activeLocation === 'acre' ? 'acre' : 'rondonia';
  const locations = {
    rondonia: snapshot?.locations?.rondonia ?? defaults.locations.rondonia,
    acre: snapshot?.locations?.acre ?? defaults.locations.acre,
  } satisfies Record<LocationKey, LocationData>;

  return {
    activeLocation,
    locations,
    phaseColors: {
      ...DEFAULT_PHASE_COLORS,
      ...(snapshot?.phaseColors ?? {}),
    },
  };
}

export function buildDerivedState(
  locations: Record<LocationKey, LocationData>,
  activeLocation: LocationKey
): ProjectDerivedState {
  const location = locations[activeLocation] ?? locations.rondonia;

  return {
    activeTanks: location.tanks,
    activeBercarioLotes: location.bercarioLotes,
    activeRecriaLotes: location.recriaLotes,
    activeEngordaLotes: location.engordaLotes,
    activePremissas: location.premissas,
    activeCustos: location.custos,
  };
}

export function selectPersistedProjectState(
  state: Pick<ProjectStateSnapshot, 'activeLocation' | 'locations' | 'phaseColors'>
): ProjectStateSnapshot {
  return {
    activeLocation: state.activeLocation,
    locations: {
      rondonia: state.locations.rondonia,
      acre: state.locations.acre,
    },
    phaseColors: { ...state.phaseColors },
  };
}
