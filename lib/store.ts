'use client';

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useStore as useZustandStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  BercarioLote,
  Custos,
  EngordaLote,
  Lancamento,
  LocationData,
  LocationKey,
  Movimentacao,
  Premissas,
  RecriaLote,
  Tank,
  TankPhase,
} from './types';
import {
  calculateBercarioLote,
  calculateEngordaLote,
  calculateRecriaLote,
} from './feedingCalculations';
import {
  generateMovimentacaoId,
  saldoDoTanque,
} from './movimentacoes';
import {
  buildDerivedState,
  createDefaultProjectState,
  normalizeProjectState,
  selectPersistedProjectState,
  type ProjectStateSnapshot,
  type ViewPeriod,
} from './projectState';

interface AppState {
  activeLocation: LocationKey;
  locations: Record<LocationKey, LocationData>;

  activeTanks: Tank[];
  activeBercarioLotes: BercarioLote[];
  activeRecriaLotes: RecriaLote[];
  activeEngordaLotes: EngordaLote[];
  activePremissas: Premissas;
  activeCustos: Custos;
  activeMovimentacoes: Movimentacao[];

  setLocation: (key: LocationKey) => void;
  updateTankPhase: (tankId: number, newPhase: TankPhase, subfase?: string) => void;
  updateTankArea: (tankId: number, areaM2: number) => void;
  updateBercarioLote: (tankId: number, data: Partial<BercarioLote>) => void;
  updateRecriaLote: (tankId: number, data: Partial<RecriaLote>) => void;
  updateEngordaLote: (tankId: number, data: Partial<EngordaLote>) => void;
  updatePremissas: (data: Partial<Premissas>) => void;
  addLancamento: (input: Omit<Lancamento, 'id'>, vinculo?: VendaVinculo) => void;
  updateLancamento: (id: string, patch: Partial<Omit<Lancamento, 'id'>>) => void;
  removeLancamento: (id: string) => void;
  addMovimentacao: (input: Omit<Movimentacao, 'id'>) => void;
  removeMovimentacao: (id: string) => void;
  transferirPeixes: (input: TransferirPeixesInput) => void;
  addBercarioLote: (lote: BercarioLote) => void;
  addRecriaLote: (lote: RecriaLote) => void;
  addEngordaLote: (lote: EngordaLote) => void;
  removeLoteForTank: (tankId: number) => void;
  addTank: (tank: Tank) => void;
  removeTank: (tankId: number) => void;

  phaseColors: Record<TankPhase, string>;
  setPhaseColor: (phase: TankPhase, color: string) => void;

  viewPeriod: ViewPeriod;
  referenceMonth: number;
  referenceYear: number;
  updatedAt: string | null;
  saveStatus: SaveStatus;
  setViewPeriod: (period: ViewPeriod) => void;
  setReferenceMonth: (year: number, month: number) => void;
  setUpdatedAt: (iso: string | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Dados opcionais para vincular uma venda (Lançamento) a um tanque de origem. */
export interface VendaVinculo {
  tankId: number;
  qtdPeixes: number;
}

export interface TransferirPeixesInput {
  origemTankId: number;
  destinoTankId: number;
  quantidade: number;
  faseDestino: Exclude<TankPhase, 'vazio'>;
  ano: number;
  mes: number;
  descricao?: string;
}

type AppStore = StoreApi<AppState>;

interface StoreProviderProps {
  initialState: ProjectStateSnapshot & { updatedAt?: string | null };
  children: ReactNode;
}

const STATE_ENDPOINT = '/api/project-state';
const DEFAULT_PROJECT_STATE_SIGNATURE = JSON.stringify(
  selectPersistedProjectState(createDefaultProjectState())
);

const StoreContext = createContext<AppStore | null>(null);
const defaultStore = createProjectStore(createDefaultProjectState());

let activeStore: AppStore | null = null;

function getActiveStore() {
  return activeStore ?? defaultStore;
}

function isDefaultProjectState(snapshot: ProjectStateSnapshot) {
  return JSON.stringify(selectPersistedProjectState(snapshot)) === DEFAULT_PROJECT_STATE_SIGNATURE;
}

function createProjectStore(initialState: ProjectStateSnapshot): AppStore {
  return createStore<AppState>()((set, get) => ({
    activeLocation: initialState.activeLocation,
    locations: initialState.locations,

    ...buildDerivedState(initialState.locations, initialState.activeLocation),
    phaseColors: { ...initialState.phaseColors },

    viewPeriod: initialState.viewPeriod,
    referenceMonth: initialState.referenceMonth,
    referenceYear: initialState.referenceYear,
    updatedAt: null,
    saveStatus: 'idle',
    setViewPeriod: (period) => set({ viewPeriod: period }),
    setReferenceMonth: (year, month) =>
      set({ referenceYear: year, referenceMonth: Math.max(0, Math.min(11, month)) }),
    setUpdatedAt: (iso) => set({ updatedAt: iso }),
    setSaveStatus: (status) => set({ saveStatus: status }),

    setLocation: (key: LocationKey) => {
      const state = get();
      const derived = buildDerivedState(state.locations, key);
      set({ activeLocation: key, ...derived });
    },

    updateTankPhase: (tankId, newPhase, subfase) =>
      set((state) => {
        const location = state.locations[state.activeLocation];
        const tank = location.tanks.find((entry) => entry.id === tankId);

        if (!tank) {
          return state;
        }

        const updatedTanks = location.tanks.map((entry) =>
          entry.id === tankId ? { ...entry, phase: newPhase, subfase } : entry
        );

        if (tank.phase === newPhase) {
          return updateLocationInState(state, () => ({ tanks: updatedTanks }));
        }

        const oldBercario = location.bercarioLotes.find((entry) => entry.tankId === tankId);
        const oldRecria = location.recriaLotes.find((entry) => entry.tankId === tankId);
        const oldEngorda = location.engordaLotes.find((entry) => entry.tankId === tankId);
        const existing = oldBercario ?? oldRecria ?? oldEngorda;

        let bercarioLotes = location.bercarioLotes.filter((entry) => entry.tankId !== tankId);
        let recriaLotes = location.recriaLotes.filter((entry) => entry.tankId !== tankId);
        let engordaLotes = location.engordaLotes.filter((entry) => entry.tankId !== tankId);

        if (existing && newPhase !== 'vazio') {
          const common = {
            tankId,
            qtd_peixes: existing.qtd_peixes,
            peso_entrada_kg: existing.peso_entrada_kg,
            peso_ganhar_kg: existing.peso_ganhar_kg,
            racao_periodo_kg: existing.racao_periodo_kg,
            peso_total_kg: existing.peso_total_kg,
            densidade_kg_m2: existing.densidade_kg_m2,
            racao_dia_sc: existing.racao_dia_sc,
            racao_mes_sc: existing.racao_mes_sc,
            racao_total_sc: existing.racao_total_sc,
          };

          if (newPhase === 'bercario') {
            bercarioLotes = [
              ...bercarioLotes,
              {
                ...calculateBercarioLote({
                  ...common,
                  nome: oldBercario?.nome ?? '',
                  peso_transferencia_kg:
                    oldBercario?.peso_transferencia_kg ??
                    oldRecria?.peso_transferencia_kg ??
                    0.1,
                }, tank),
              },
            ];
          } else if (newPhase === 'recria') {
            recriaLotes = [
              ...recriaLotes,
              calculateRecriaLote({
                  ...common,
                peso_transferencia_kg:
                  oldRecria?.peso_transferencia_kg ??
                  oldBercario?.peso_transferencia_kg ??
                  0.7,
                periodo_meses: oldRecria?.periodo_meses ?? oldEngorda?.periodo_meses ?? 5,
              }, tank, location.premissas),
            ];
          } else if (newPhase === 'engorda') {
            engordaLotes = [
              ...engordaLotes,
              calculateEngordaLote({
                ...common,
                modulo: oldEngorda?.modulo ?? subfase ?? '',
                conversao_alimentar: oldEngorda?.conversao_alimentar ?? 2,
                peso_final_kg_peixe: oldEngorda?.peso_final_kg_peixe ?? 2.5,
                periodo_meses: oldEngorda?.periodo_meses ?? oldRecria?.periodo_meses ?? 5,
              }, tank, location.premissas),
            ];
          }
        }

        return updateLocationInState(state, () => ({
          tanks: updatedTanks,
          bercarioLotes,
          recriaLotes,
          engordaLotes,
        }));
      }),

    updateTankArea: (tankId, areaM2) =>
      set((state) =>
        updateLocationInState(state, (location) => {
          const normalizedAreaM2 = Math.max(0, Math.round(areaM2));
          const updatedTank = location.tanks.find((entry) => entry.id === tankId);

          if (!updatedTank || normalizedAreaM2 <= 0) {
            return {};
          }

          const tankWithArea = {
            ...updatedTank,
            area_m2: normalizedAreaM2,
            area_ha: Math.round((normalizedAreaM2 / 10000) * 10000) / 10000,
          };

          return {
            tanks: location.tanks.map((entry) =>
              entry.id === tankId ? tankWithArea : entry
            ),
            bercarioLotes: location.bercarioLotes.map((entry) =>
              entry.tankId === tankId ? calculateBercarioLote(entry, tankWithArea) : entry
            ),
            recriaLotes: location.recriaLotes.map((entry) =>
              entry.tankId === tankId ? calculateRecriaLote(entry, tankWithArea, location.premissas) : entry
            ),
            engordaLotes: location.engordaLotes.map((entry) =>
              entry.tankId === tankId ? calculateEngordaLote(entry, tankWithArea, location.premissas) : entry
            ),
          };
        })
      ),

    updateBercarioLote: (tankId, data) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          bercarioLotes: location.bercarioLotes.map((entry) =>
            entry.tankId === tankId
              ? calculateBercarioLote(
                  { ...entry, ...data },
                  location.tanks.find((tank) => tank.id === tankId)
                )
              : entry
          ),
        }))
      ),

    updateRecriaLote: (tankId, data) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          recriaLotes: location.recriaLotes.map((entry) =>
            entry.tankId === tankId
              ? calculateRecriaLote(
                  { ...entry, ...data },
                  location.tanks.find((tank) => tank.id === tankId),
                  location.premissas
                )
              : entry
          ),
        }))
      ),

    updateEngordaLote: (tankId, data) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          engordaLotes: location.engordaLotes.map((entry) =>
            entry.tankId === tankId
              ? calculateEngordaLote(
                  { ...entry, ...data },
                  location.tanks.find((tank) => tank.id === tankId),
                  location.premissas
                )
              : entry
          ),
        }))
      ),

    updatePremissas: (data) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          premissas: { ...location.premissas, ...data },
        }))
      ),

    addLancamento: (input, vinculo) =>
      set((state) =>
        updateLocationInState(state, (location) => {
          const lancamentoId = generateLancamentoId();
          const custos = {
            ...location.custos,
            lancamentos: [
              ...location.custos.lancamentos,
              { ...input, id: lancamentoId },
            ],
          };

          // Venda vinculada a um tanque: registra também a saída de peixes.
          if (vinculo && vinculo.qtdPeixes > 0) {
            const tank = location.tanks.find((t) => t.id === vinculo.tankId);
            const mov: Movimentacao = {
              id: generateMovimentacaoId(),
              tankId: vinculo.tankId,
              tipo: 'venda',
              direcao: 'saida',
              quantidade: Math.max(0, Math.round(vinculo.qtdPeixes)),
              ano: input.ano,
              mes: input.mes,
              ...(tank?.phase ? { faseTanque: tank.phase } : {}),
              lancamentoId,
              ...(input.descricao ? { descricao: input.descricao } : {}),
            };
            return {
              custos,
              ...applyMovimentacoes({ ...location, custos }, [mov], [vinculo.tankId]),
            };
          }

          return { custos };
        })
      ),

    updateLancamento: (id, patch) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          custos: {
            ...location.custos,
            lancamentos: location.custos.lancamentos.map((l) =>
              l.id === id ? { ...l, ...patch } : l
            ),
          },
        }))
      ),

    removeLancamento: (id) =>
      set((state) =>
        updateLocationInState(state, (location) => {
          const custos = {
            ...location.custos,
            lancamentos: location.custos.lancamentos.filter((l) => l.id !== id),
          };

          // Remove também a movimentação de peixes vinculada a esta venda.
          const linked = location.movimentacoes.filter((m) => m.lancamentoId === id);
          if (linked.length === 0) return { custos };

          const movimentacoes = location.movimentacoes.filter((m) => m.lancamentoId !== id);
          const tankIds = linked.map((m) => m.tankId);
          return {
            custos,
            movimentacoes,
            ...recalcTanques({ ...location, movimentacoes }, tankIds),
          };
        })
      ),

    addMovimentacao: (input) =>
      set((state) =>
        updateLocationInState(state, (location) => {
          const mov: Movimentacao = { ...input, id: generateMovimentacaoId() };
          const tankIds = [input.tankId, ...(input.tankDestino != null ? [input.tankDestino] : [])];
          return applyMovimentacoes(location, [mov], tankIds);
        })
      ),

    removeMovimentacao: (id) =>
      set((state) =>
        updateLocationInState(state, (location) => {
          const target = location.movimentacoes.find((m) => m.id === id);
          if (!target) return {};
          const movimentacoes = location.movimentacoes.filter((m) => m.id !== id);
          const tankIds = [
            target.tankId,
            ...(target.tankDestino != null ? [target.tankDestino] : []),
          ];
          return {
            movimentacoes,
            ...recalcTanques({ ...location, movimentacoes }, tankIds),
          };
        })
      ),

    transferirPeixes: ({ origemTankId, destinoTankId, quantidade, faseDestino, ano, mes, descricao }) =>
      set((state) =>
        updateLocationInState(state, (location) => {
          const qtd = Math.max(0, Math.round(quantidade));
          if (qtd <= 0 || origemTankId === destinoTankId) return {};
          const destinoTank = location.tanks.find((t) => t.id === destinoTankId);
          if (!destinoTank) return {};
          const saldoOrigem = saldoDoTanque(origemTankId, location.movimentacoes);
          if (saldoOrigem <= 0) return {};
          const moveQtd = Math.min(qtd, saldoOrigem);
          const origemTank = location.tanks.find((t) => t.id === origemTankId);

          // 1) coloca o tanque destino na fase de destino e garante o lote
          const tanks = location.tanks.map((t) =>
            t.id === destinoTankId ? { ...t, phase: faseDestino } : t
          );
          let working: LocationData = { ...location, tanks };
          working = { ...working, ...ensureLoteForPhase(working, destinoTankId, faseDestino) };

          // 2) saída na origem + entrada no destino
          const saida: Movimentacao = {
            id: generateMovimentacaoId(),
            tankId: origemTankId,
            tipo: 'transferencia',
            direcao: 'saida',
            quantidade: moveQtd,
            ano,
            mes,
            ...(origemTank?.phase ? { faseTanque: origemTank.phase } : {}),
            tankDestino: destinoTankId,
            faseDestino,
            ...(descricao ? { descricao } : {}),
          };
          const entrada: Movimentacao = {
            id: generateMovimentacaoId(),
            tankId: destinoTankId,
            tipo: 'transferencia',
            direcao: 'entrada',
            quantidade: moveQtd,
            ano,
            mes,
            faseTanque: faseDestino,
            ...(descricao ? { descricao } : {}),
          };

          return {
            tanks,
            ...applyMovimentacoes(working, [saida, entrada], [origemTankId, destinoTankId]),
          };
        })
      ),

    addBercarioLote: (lote) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          bercarioLotes: [
            ...location.bercarioLotes,
            calculateBercarioLote(lote, location.tanks.find((tank) => tank.id === lote.tankId)),
          ],
        }))
      ),

    addRecriaLote: (lote) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          recriaLotes: [
            ...location.recriaLotes,
            calculateRecriaLote(
              lote,
              location.tanks.find((tank) => tank.id === lote.tankId),
              location.premissas
            ),
          ],
        }))
      ),

    addEngordaLote: (lote) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          engordaLotes: [
            ...location.engordaLotes,
            calculateEngordaLote(
              lote,
              location.tanks.find((tank) => tank.id === lote.tankId),
              location.premissas
            ),
          ],
        }))
      ),

    removeLoteForTank: (tankId) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          bercarioLotes: location.bercarioLotes.filter((entry) => entry.tankId !== tankId),
          recriaLotes: location.recriaLotes.filter((entry) => entry.tankId !== tankId),
          engordaLotes: location.engordaLotes.filter((entry) => entry.tankId !== tankId),
        }))
      ),

    addTank: (tank) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          tanks: [...location.tanks, tank],
        }))
      ),

    removeTank: (tankId) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          tanks: location.tanks.filter((entry) => entry.id !== tankId),
          bercarioLotes: location.bercarioLotes.filter((entry) => entry.tankId !== tankId),
          recriaLotes: location.recriaLotes.filter((entry) => entry.tankId !== tankId),
          engordaLotes: location.engordaLotes.filter((entry) => entry.tankId !== tankId),
        }))
      ),

    setPhaseColor: (phase, color) =>
      set((state) => ({
        phaseColors: { ...state.phaseColors, [phase]: color },
      })),
  }));
}

function generateLancamentoId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `lan_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function updateLocationInState(
  state: AppState,
  updater: (location: LocationData) => Partial<LocationData>
): Partial<AppState> {
  const location = state.locations[state.activeLocation];
  const updatedLocation = { ...location, ...updater(location) };
  const locations = { ...state.locations, [state.activeLocation]: updatedLocation };

  return {
    locations,
    ...buildDerivedState(locations, state.activeLocation),
  };
}

function defaultLoteForPhase(
  tankId: number,
  phase: Exclude<TankPhase, 'vazio'>
): BercarioLote | RecriaLote | EngordaLote {
  const base = {
    tankId,
    qtd_peixes: 0,
    peso_entrada_kg: 0,
    peso_ganhar_kg: 0,
    racao_periodo_kg: 0,
    peso_total_kg: 0,
    densidade_kg_m2: 0,
    racao_dia_sc: 0,
    racao_mes_sc: 0,
    racao_total_sc: 0,
  };
  if (phase === 'bercario') {
    return { ...base, nome: '', peso_transferencia_kg: 0.1 };
  }
  if (phase === 'recria') {
    return { ...base, peso_transferencia_kg: 0.7, periodo_meses: 5 };
  }
  return {
    ...base,
    modulo: '',
    conversao_alimentar: 2,
    peso_final_kg_peixe: 2.5,
    periodo_meses: 5,
  };
}

/**
 * Garante que o tanque tenha exatamente um lote na fase informada, removendo
 * lotes de outras fases (o histórico de peixes vive no livro de movimentações,
 * então a contagem não se perde). Não recalcula saldo — isso fica para
 * `recalcSaldoTanque`.
 */
function ensureLoteForPhase(
  location: LocationData,
  tankId: number,
  phase: Exclude<TankPhase, 'vazio'>
): Partial<LocationData> {
  const bercarioLotes = location.bercarioLotes.filter(
    (l) => l.tankId !== tankId || phase === 'bercario'
  );
  const recriaLotes = location.recriaLotes.filter(
    (l) => l.tankId !== tankId || phase === 'recria'
  );
  const engordaLotes = location.engordaLotes.filter(
    (l) => l.tankId !== tankId || phase === 'engorda'
  );

  const novo = defaultLoteForPhase(tankId, phase);
  if (phase === 'bercario' && !bercarioLotes.some((l) => l.tankId === tankId)) {
    bercarioLotes.push(novo as BercarioLote);
  } else if (phase === 'recria' && !recriaLotes.some((l) => l.tankId === tankId)) {
    recriaLotes.push(novo as RecriaLote);
  } else if (phase === 'engorda' && !engordaLotes.some((l) => l.tankId === tankId)) {
    engordaLotes.push(novo as EngordaLote);
  }

  return { bercarioLotes, recriaLotes, engordaLotes };
}

/**
 * Recalcula `qtd_peixes` do lote ativo de um tanque a partir do saldo do livro
 * de movimentações e re-roda o `calculate*Lote` correspondente. O peso de
 * entrada (total) é escalado para preservar o peso por unidade.
 */
function recalcSaldoTanque(location: LocationData, tankId: number): Partial<LocationData> {
  const saldo = saldoDoTanque(tankId, location.movimentacoes);
  const tank = location.tanks.find((t) => t.id === tankId);

  const scaleLote = <T extends { qtd_peixes: number; peso_entrada_kg: number }>(
    lote: T
  ): T => {
    const prevQtd = Math.max(0, lote.qtd_peixes);
    const pesoEntradaUn = prevQtd > 0 ? lote.peso_entrada_kg / prevQtd : 0;
    return { ...lote, qtd_peixes: saldo, peso_entrada_kg: pesoEntradaUn * saldo };
  };

  const patch: Partial<LocationData> = {};
  if (location.bercarioLotes.some((l) => l.tankId === tankId)) {
    patch.bercarioLotes = location.bercarioLotes.map((l) =>
      l.tankId === tankId ? calculateBercarioLote(scaleLote(l), tank) : l
    );
  }
  if (location.recriaLotes.some((l) => l.tankId === tankId)) {
    patch.recriaLotes = location.recriaLotes.map((l) =>
      l.tankId === tankId ? calculateRecriaLote(scaleLote(l), tank, location.premissas) : l
    );
  }
  if (location.engordaLotes.some((l) => l.tankId === tankId)) {
    patch.engordaLotes = location.engordaLotes.map((l) =>
      l.tankId === tankId ? calculateEngordaLote(scaleLote(l), tank, location.premissas) : l
    );
  }
  return patch;
}

/** Recalcula os lotes de vários tanques a partir do livro atual de `location`. */
function recalcTanques(location: LocationData, tankIds: number[]): Partial<LocationData> {
  let working = location;
  for (const tankId of Array.from(new Set(tankIds))) {
    working = { ...working, ...recalcSaldoTanque(working, tankId) };
  }
  return {
    bercarioLotes: working.bercarioLotes,
    recriaLotes: working.recriaLotes,
    engordaLotes: working.engordaLotes,
  };
}

/**
 * Anexa novas movimentações ao livro e recalcula o saldo dos tanques afetados,
 * retornando o patch de location pronto para `updateLocationInState`.
 */
function applyMovimentacoes(
  location: LocationData,
  novas: Movimentacao[],
  tankIds: number[]
): Partial<LocationData> {
  const movimentacoes = [...location.movimentacoes, ...novas];
  return {
    movimentacoes,
    ...recalcTanques({ ...location, movimentacoes }, tankIds),
  };
}

function readLegacyProjectState(): ProjectStateSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem('piscicultura-storage');
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as
      | { state?: Partial<ProjectStateSnapshot> }
      | Partial<ProjectStateSnapshot>;

    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      return normalizeProjectState(parsed.state ?? null);
    }

    return normalizeProjectState(parsed as Partial<ProjectStateSnapshot> | null);
  } catch {
    return null;
  }
}

function useBoundStore<T>(selector: (state: AppState) => T): T {
  const contextStore = useContext(StoreContext);
  const store = contextStore ?? activeStore ?? defaultStore;
  return useZustandStore(store, selector);
}

type PersistResult =
  | { status: 'ok'; updatedAt: string | null }
  | { status: 'conflict' };

async function persistProjectState(
  snapshot: ProjectStateSnapshot,
  expectedUpdatedAt: string | null,
  keepalive = false
): Promise<PersistResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (expectedUpdatedAt) {
    headers['x-expected-updated-at'] = expectedUpdatedAt;
  }

  const response = await fetch(STATE_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(snapshot),
    keepalive,
  });

  if (response.status === 409) {
    return { status: 'conflict' };
  }

  if (!response.ok) {
    throw new Error(`Falha ao salvar estado do projeto (${response.status})`);
  }

  try {
    const body = (await response.json()) as { updatedAt?: string | null };
    return { status: 'ok', updatedAt: body?.updatedAt ?? null };
  } catch {
    return { status: 'ok', updatedAt: null };
  }
}

export function StoreProvider({ initialState, children }: StoreProviderProps) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProjectStore(initialState);
    if (initialState.updatedAt) {
      storeRef.current.getState().setUpdatedAt(initialState.updatedAt);
    }
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) {
      return undefined;
    }

    activeStore = store;

    let lastPersistedSignature = JSON.stringify(
      selectPersistedProjectState(store.getState())
    );
    let pendingSnapshot = selectPersistedProjectState(store.getState());
    let pendingSignature = lastPersistedSignature;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let saveChain = Promise.resolve();

    const flushSnapshot = (
      snapshot: ProjectStateSnapshot,
      signature: string,
      keepalive = false
    ) => {
      saveChain = saveChain.then(async () => {
        if (signature === lastPersistedSignature) {
          return;
        }

        store.getState().setSaveStatus('saving');
        try {
          const expectedUpdatedAt = store.getState().updatedAt;
          const result = await persistProjectState(snapshot, expectedUpdatedAt, keepalive);

          if (result.status === 'conflict') {
            // Outro cliente alterou o estado; não sobrescreve. O usuário é
            // avisado e deve recarregar para obter a versão mais recente.
            store.getState().setSaveStatus('error');
            console.warn(
              'Conflito ao salvar: o estado foi alterado em outro lugar. Recarregue a página.'
            );
            return;
          }

          lastPersistedSignature = signature;
          if (result.updatedAt) {
            store.getState().setUpdatedAt(result.updatedAt);
          }
          store.getState().setSaveStatus('saved');
        } catch (error) {
          store.getState().setSaveStatus('error');
          console.error('Erro ao salvar estado no Postgres:', error);
        }
      });

      return saveChain;
    };

    const schedulePersist = (snapshot: ProjectStateSnapshot) => {
      const signature = JSON.stringify(snapshot);
      if (signature === lastPersistedSignature) {
        return;
      }

      pendingSnapshot = snapshot;
      pendingSignature = signature;

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        const snapshotToSave = pendingSnapshot;
        const signatureToSave = pendingSignature;
        timer = null;
        void flushSnapshot(snapshotToSave, signatureToSave);
      }, 600);
    };

    const unsubscribe = store.subscribe((state) => {
      schedulePersist(selectPersistedProjectState(state));
    });

    const legacySnapshot = readLegacyProjectState();
    if (
      legacySnapshot &&
      !isDefaultProjectState(legacySnapshot) &&
      isDefaultProjectState(selectPersistedProjectState(store.getState()))
    ) {
      store.setState({
        activeLocation: legacySnapshot.activeLocation,
        locations: legacySnapshot.locations,
        ...buildDerivedState(
          legacySnapshot.locations,
          legacySnapshot.activeLocation
        ),
        phaseColors: { ...legacySnapshot.phaseColors },
      });
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      unsubscribe();

      if (activeStore === store) {
        activeStore = null;
      }
    };
  }, []);

  return createElement(StoreContext.Provider, {
    value: storeRef.current,
    children,
  });
}

type UseStoreHook = {
  <T>(selector: (state: AppState) => T): T;
  getState: () => AppState;
};

export const useStore = Object.assign(useBoundStore, {
  getState: () => getActiveStore().getState(),
}) as UseStoreHook;
