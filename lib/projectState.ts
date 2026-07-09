import { initialLocations } from './initialData';
import { CATEGORIAS_CUSTO, CATEGORIAS_RECEITA } from './lancamentos';
import { seedMovimentacoesFromLotes } from './movimentacoes';
import { PHASE_COLORS } from './types';
import type {
  CategoriaLancamento,
  Custos,
  EngordaLote,
  Lancamento,
  LocationData,
  LocationKey,
  Movimentacao,
  MovimentacaoDirecao,
  MovimentacaoTipo,
  Premissas,
  RecriaLote,
  Tank,
  TankPhase,
  TipoLancamento,
  BercarioLote,
} from './types';

const VALID_CATEGORIAS: CategoriaLancamento[] = [
  ...CATEGORIAS_CUSTO,
  ...CATEGORIAS_RECEITA,
];

const VALID_PHASES: TankPhase[] = ['bercario', 'recria', 'engorda', 'vazio'];
const VALID_MOV_TIPOS: MovimentacaoTipo[] = ['povoamento', 'venda', 'transferencia', 'ajuste'];
const VALID_MOV_DIRECOES: MovimentacaoDirecao[] = ['entrada', 'saida'];

// Limites defensivos contra payloads abusivos (DoS / inchaço do banco).
const MAX_TANKS = 1000;
const MAX_LOTES = 1000;
const MAX_LANCAMENTOS = 10000;
const MAX_MOVIMENTACOES = 20000;
const MAX_STRING_LENGTH = 200;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

function toFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toCleanString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, MAX_STRING_LENGTH);
}

function toValidPhase(value: unknown): TankPhase {
  return VALID_PHASES.includes(value as TankPhase) ? (value as TankPhase) : 'vazio';
}

function sanitizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR_RE.test(value) ? value : fallback;
}

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
  activeMovimentacoes: Movimentacao[];
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
  const categoria = r.categoria as CategoriaLancamento;
  const tipo: TipoLancamento =
    r.tipo === 'custo' || r.tipo === 'receita'
      ? r.tipo
      : (CATEGORIAS_RECEITA as string[]).includes(categoria as string)
        ? 'receita'
        : 'custo';

  const result: Lancamento = {
    id,
    ano,
    mes,
    tipo,
    categoria,
    quantidade,
    precoUnitario,
  };
  if (typeof r.descricao === 'string') {
    result.descricao = toCleanString(r.descricao);
  }
  return result;
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
    ? (rawLancamentos
        .slice(0, MAX_LANCAMENTOS)
        .map(normalizeLancamento)
        .filter(Boolean) as Lancamento[])
    : [...fallback.lancamentos];
  return {
    lancamentos,
  };
}

function normalizeMovimentacao(raw: unknown): Movimentacao | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Movimentacao>;
  if (typeof r.tankId !== 'number' || !Number.isFinite(r.tankId)) return null;
  if (!VALID_MOV_TIPOS.includes(r.tipo as MovimentacaoTipo)) return null;
  if (!VALID_MOV_DIRECOES.includes(r.direcao as MovimentacaoDirecao)) return null;
  const ano = typeof r.ano === 'number' && Number.isFinite(r.ano) ? Math.floor(r.ano) : null;
  const mes = typeof r.mes === 'number' && Number.isFinite(r.mes) ? Math.floor(r.mes) : null;
  if (ano === null || mes === null || mes < 1 || mes > 12) return null;
  const quantidade =
    typeof r.quantidade === 'number' && Number.isFinite(r.quantidade)
      ? Math.max(0, r.quantidade)
      : 0;
  const id = typeof r.id === 'string' && r.id.length > 0 ? r.id : generateId();

  const result: Movimentacao = {
    id,
    tankId: Math.floor(r.tankId),
    tipo: r.tipo as MovimentacaoTipo,
    direcao: r.direcao as MovimentacaoDirecao,
    quantidade,
    ano,
    mes,
  };
  if (VALID_PHASES.includes(r.faseTanque as TankPhase)) result.faseTanque = r.faseTanque as TankPhase;
  if (typeof r.tankDestino === 'number' && Number.isFinite(r.tankDestino)) {
    result.tankDestino = Math.floor(r.tankDestino);
  }
  if (VALID_PHASES.includes(r.faseDestino as TankPhase)) result.faseDestino = r.faseDestino as TankPhase;
  if (typeof r.lancamentoId === 'string' && r.lancamentoId.length > 0) {
    result.lancamentoId = toCleanString(r.lancamentoId);
  }
  if (typeof r.descricao === 'string') result.descricao = toCleanString(r.descricao);
  return result;
}

function normalizeTank(raw: unknown): Tank | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Tank>;
  if (typeof r.id !== 'number' || !Number.isFinite(r.id)) return null;
  const tank: Tank = {
    id: Math.floor(r.id),
    area_m2: toFiniteNumber(r.area_m2),
    area_ha: toFiniteNumber(r.area_ha),
    phase: toValidPhase(r.phase),
  };
  if (r.subfase !== undefined) tank.subfase = toCleanString(r.subfase);
  return tank;
}

function normalizeBercarioLote(raw: unknown): BercarioLote | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BercarioLote>;
  if (typeof r.tankId !== 'number' || !Number.isFinite(r.tankId)) return null;
  return {
    tankId: Math.floor(r.tankId),
    nome: toCleanString(r.nome),
    qtd_peixes: toFiniteNumber(r.qtd_peixes),
    peso_entrada_kg: toFiniteNumber(r.peso_entrada_kg),
    peso_ganhar_kg: toFiniteNumber(r.peso_ganhar_kg),
    racao_periodo_kg: toFiniteNumber(r.racao_periodo_kg),
    peso_total_kg: toFiniteNumber(r.peso_total_kg),
    densidade_kg_m2: toFiniteNumber(r.densidade_kg_m2),
    peso_transferencia_kg: toFiniteNumber(r.peso_transferencia_kg),
    racao_dia_sc: toFiniteNumber(r.racao_dia_sc),
    racao_mes_sc: toFiniteNumber(r.racao_mes_sc),
    racao_total_sc: toFiniteNumber(r.racao_total_sc),
  };
}

function normalizeRecriaLote(raw: unknown): RecriaLote | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<RecriaLote>;
  if (typeof r.tankId !== 'number' || !Number.isFinite(r.tankId)) return null;
  return {
    tankId: Math.floor(r.tankId),
    qtd_peixes: toFiniteNumber(r.qtd_peixes),
    peso_entrada_kg: toFiniteNumber(r.peso_entrada_kg),
    peso_ganhar_kg: toFiniteNumber(r.peso_ganhar_kg),
    racao_periodo_kg: toFiniteNumber(r.racao_periodo_kg),
    peso_total_kg: toFiniteNumber(r.peso_total_kg),
    densidade_kg_m2: toFiniteNumber(r.densidade_kg_m2),
    peso_transferencia_kg: toFiniteNumber(r.peso_transferencia_kg),
    racao_dia_sc: toFiniteNumber(r.racao_dia_sc),
    racao_mes_sc: toFiniteNumber(r.racao_mes_sc),
    racao_total_sc: toFiniteNumber(r.racao_total_sc),
    periodo_meses: toFiniteNumber(r.periodo_meses),
  };
}

function normalizeEngordaLote(raw: unknown): EngordaLote | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<EngordaLote>;
  if (typeof r.tankId !== 'number' || !Number.isFinite(r.tankId)) return null;
  return {
    tankId: Math.floor(r.tankId),
    modulo: toCleanString(r.modulo),
    qtd_peixes: toFiniteNumber(r.qtd_peixes),
    peso_entrada_kg: toFiniteNumber(r.peso_entrada_kg),
    peso_ganhar_kg: toFiniteNumber(r.peso_ganhar_kg),
    racao_periodo_kg: toFiniteNumber(r.racao_periodo_kg),
    conversao_alimentar: toFiniteNumber(r.conversao_alimentar),
    peso_final_kg_peixe: toFiniteNumber(r.peso_final_kg_peixe),
    peso_total_kg: toFiniteNumber(r.peso_total_kg),
    densidade_kg_m2: toFiniteNumber(r.densidade_kg_m2),
    racao_dia_sc: toFiniteNumber(r.racao_dia_sc),
    racao_mes_sc: toFiniteNumber(r.racao_mes_sc),
    racao_total_sc: toFiniteNumber(r.racao_total_sc),
    periodo_meses: toFiniteNumber(r.periodo_meses),
  };
}

function normalizePremissas(
  premissas: Partial<Premissas> | undefined,
  fallback: Premissas
): Premissas {
  if (!premissas || typeof premissas !== 'object') return fallback;
  return {
    producao_anual: toFiniteNumber(premissas.producao_anual, fallback.producao_anual),
    conversao_alimentar: toFiniteNumber(premissas.conversao_alimentar, fallback.conversao_alimentar),
    ciclos_ano: toFiniteNumber(premissas.ciclos_ano, fallback.ciclos_ano),
    preco_venda: toFiniteNumber(premissas.preco_venda, fallback.preco_venda),
    peso_final_engorda: toFiniteNumber(premissas.peso_final_engorda, fallback.peso_final_engorda),
    peso_transfer_recria: toFiniteNumber(premissas.peso_transfer_recria, fallback.peso_transfer_recria),
    peso_transfer_bercario: toFiniteNumber(premissas.peso_transfer_bercario, fallback.peso_transfer_bercario),
    periodo_engorda: toFiniteNumber(premissas.periodo_engorda, fallback.periodo_engorda),
    periodo_recria: toFiniteNumber(premissas.periodo_recria, fallback.periodo_recria),
  };
}

function normalizeArray<T>(
  raw: unknown,
  normalizer: (item: unknown) => T | null,
  limit: number,
  fallback: T[]
): T[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.slice(0, limit).map(normalizer).filter((item): item is T => item !== null);
}

function normalizeLocation(
  location: Partial<LocationData> | undefined,
  fallback: LocationData
): LocationData {
  if (!location || typeof location !== 'object') return fallback;
  const bercarioLotes = normalizeArray(location.bercarioLotes, normalizeBercarioLote, MAX_LOTES, fallback.bercarioLotes);
  const recriaLotes = normalizeArray(location.recriaLotes, normalizeRecriaLote, MAX_LOTES, fallback.recriaLotes);
  const engordaLotes = normalizeArray(location.engordaLotes, normalizeEngordaLote, MAX_LOTES, fallback.engordaLotes);

  // Migração: estados antigos não têm o campo `movimentacoes`. Nesse caso,
  // semeamos um `povoamento` por lote para o saldo derivado reconciliar com
  // o `qtd_peixes` já cadastrado. Um array presente (mesmo vazio) é respeitado.
  const movimentacoes = Array.isArray(location.movimentacoes)
    ? normalizeArray(location.movimentacoes, normalizeMovimentacao, MAX_MOVIMENTACOES, fallback.movimentacoes)
    : seedMovimentacoesFromLotes({ bercarioLotes, recriaLotes, engordaLotes });

  return {
    tanks: normalizeArray(location.tanks, normalizeTank, MAX_TANKS, fallback.tanks),
    bercarioLotes,
    recriaLotes,
    engordaLotes,
    premissas: normalizePremissas(location.premissas, fallback.premissas),
    custos: normalizeCustos(location.custos, fallback.custos),
    movimentacoes,
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

  // Campos legados (viewPeriod, referenceMonth, referenceYear) são ignorados
  // de propósito: a perspectiva temporal global foi removida após a aba Custos.

  const rawColors = snapshot?.phaseColors;
  const phaseColors = { ...DEFAULT_PHASE_COLORS };
  if (rawColors && typeof rawColors === 'object') {
    for (const phase of VALID_PHASES) {
      phaseColors[phase] = sanitizeColor(rawColors[phase], DEFAULT_PHASE_COLORS[phase]);
    }
    // Migra o amarelo antigo da recria para a nova cor padrão
    if (phaseColors.recria.toLowerCase() === '#f3fa6b') {
      phaseColors.recria = DEFAULT_PHASE_COLORS.recria;
    }
  }

  return {
    activeLocation,
    locations,
    phaseColors,
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
    activeMovimentacoes: location.movimentacoes,
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
