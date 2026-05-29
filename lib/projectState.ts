import { initialLocations } from './initialData';
import { PHASE_COLORS } from './types';
import type {
  CategoriaLancamento,
  Custos,
  EngordaLote,
  Lancamento,
  LocationData,
  LocationKey,
  Premissas,
  RecriaLote,
  Tank,
  TankPhase,
  BercarioLote,
} from './types';

const VALID_CATEGORIAS: CategoriaLancamento[] = [
  'racao',
  'ferramentas',
  'sal_grosso',
  'cal',
  'mao_obra',
  'outras',
];

export type ViewPeriod = 'anual' | 'mensal';

export interface ProjectStateSnapshot {
  activeLocation: LocationKey;
  locations: Record<LocationKey, LocationData>;
  phaseColors: Record<TankPhase, string>;
  viewPeriod: ViewPeriod;
  referenceMonth: number; // 0–11 (jan = 0)
  referenceYear: number;
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
  const now = new Date();
  return {
    activeLocation: 'rondonia',
    locations: structuredClone(initialLocations) as Record<LocationKey, LocationData>,
    phaseColors: { ...DEFAULT_PHASE_COLORS },
    viewPeriod: 'anual',
    referenceMonth: now.getMonth(),
    referenceYear: now.getFullYear(),
  };
}

function normalizeLancamento(raw: unknown): Lancamento | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Lancamento>;
  if (!VALID_CATEGORIAS.includes(r.categoria as CategoriaLancamento)) return null;
  const ano = typeof r.ano === 'number' && Number.isFinite(r.ano) ? Math.floor(r.ano) : null;
  const mes = typeof r.mes === 'number' && Number.isFinite(r.mes) ? Math.floor(r.mes) : null;
  if (ano === null || mes === null || mes < 1 || mes > 12) return null;
  const quantidade = typeof r.quantidade === 'number' && Number.isFinite(r.quantidade) ? r.quantidade : 0;
  const precoUnitario = typeof r.precoUnitario === 'number' && Number.isFinite(r.precoUnitario) ? r.precoUnitario : 0;
  const id = typeof r.id === 'string' && r.id.length > 0 ? r.id : generateId();
  return {
    id,
    ano,
    mes,
    categoria: r.categoria as CategoriaLancamento,
    quantidade,
    precoUnitario,
  };
}

function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `lan_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function normalizeCustos(custos: Partial<Custos> | undefined, fallback: Custos): Custos {
  const rawLancamentos = Array.isArray(custos?.lancamentos) ? custos!.lancamentos : null;
  const lancamentos = rawLancamentos
    ? (rawLancamentos.map(normalizeLancamento).filter(Boolean) as Lancamento[])
    : [...fallback.lancamentos];
  return {
    lancamentos,
  };
}

function normalizeLocation(
  location: Partial<LocationData> | undefined,
  fallback: LocationData
): LocationData {
  if (!location) return fallback;
  return {
    tanks: location.tanks ?? fallback.tanks,
    bercarioLotes: location.bercarioLotes ?? fallback.bercarioLotes,
    recriaLotes: location.recriaLotes ?? fallback.recriaLotes,
    engordaLotes: location.engordaLotes ?? fallback.engordaLotes,
    premissas: location.premissas ?? fallback.premissas,
    custos: normalizeCustos(location.custos, fallback.custos),
  };
}

export function normalizeProjectState(
  snapshot?: Partial<ProjectStateSnapshot> | null
): ProjectStateSnapshot {
  const defaults = createDefaultProjectState();
  const activeLocation = snapshot?.activeLocation === 'acre' ? 'acre' : 'rondonia';
  const locations = {
    rondonia: normalizeLocation(snapshot?.locations?.rondonia, defaults.locations.rondonia),
    acre: normalizeLocation(snapshot?.locations?.acre, defaults.locations.acre),
  } satisfies Record<LocationKey, LocationData>;

  const viewPeriod: ViewPeriod = snapshot?.viewPeriod === 'mensal' ? 'mensal' : 'anual';
  const rawMonth = snapshot?.referenceMonth;
  const referenceMonth =
    typeof rawMonth === 'number' && Number.isInteger(rawMonth) && rawMonth >= 0 && rawMonth <= 11
      ? rawMonth
      : defaults.referenceMonth;
  const rawYear = snapshot?.referenceYear;
  const referenceYear =
    typeof rawYear === 'number' && Number.isFinite(rawYear) && rawYear >= 1900 && rawYear <= 3000
      ? Math.floor(rawYear)
      : defaults.referenceYear;

  return {
    activeLocation,
    locations,
    phaseColors: {
      ...DEFAULT_PHASE_COLORS,
      ...(snapshot?.phaseColors ?? {}),
    },
    viewPeriod,
    referenceMonth,
    referenceYear,
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
  state: Pick<
    ProjectStateSnapshot,
    'activeLocation' | 'locations' | 'phaseColors' | 'viewPeriod' | 'referenceMonth' | 'referenceYear'
  >
): ProjectStateSnapshot {
  return {
    activeLocation: state.activeLocation,
    locations: {
      rondonia: state.locations.rondonia,
      acre: state.locations.acre,
    },
    phaseColors: { ...state.phaseColors },
    viewPeriod: state.viewPeriod,
    referenceMonth: state.referenceMonth,
    referenceYear: state.referenceYear,
  };
}
