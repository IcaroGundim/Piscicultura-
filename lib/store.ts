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
  LocationData,
  LocationKey,
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
  buildDerivedState,
  createDefaultProjectState,
  normalizeProjectState,
  selectPersistedProjectState,
  type ProjectStateSnapshot,
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

  setLocation: (key: LocationKey) => void;
  updateTankPhase: (tankId: number, newPhase: TankPhase, subfase?: string) => void;
  updateTankArea: (tankId: number, areaM2: number) => void;
  updateBercarioLote: (tankId: number, data: Partial<BercarioLote>) => void;
  updateRecriaLote: (tankId: number, data: Partial<RecriaLote>) => void;
  updateEngordaLote: (tankId: number, data: Partial<EngordaLote>) => void;
  updatePremissas: (data: Partial<Premissas>) => void;
  updateCustos: (data: Partial<Custos>) => void;
  addBercarioLote: (lote: BercarioLote) => void;
  addRecriaLote: (lote: RecriaLote) => void;
  addEngordaLote: (lote: EngordaLote) => void;
  removeLoteForTank: (tankId: number) => void;
  addTank: (tank: Tank) => void;
  removeTank: (tankId: number) => void;

  phaseColors: Record<TankPhase, string>;
  setPhaseColor: (phase: TankPhase, color: string) => void;
}

type AppStore = StoreApi<AppState>;

interface StoreProviderProps {
  initialState: ProjectStateSnapshot;
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

    updateCustos: (data) =>
      set((state) =>
        updateLocationInState(state, (location) => ({
          custos: { ...location.custos, ...data },
        }))
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

async function persistProjectState(snapshot: ProjectStateSnapshot, keepalive = false) {
  const response = await fetch(STATE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(snapshot),
    keepalive,
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar estado do projeto (${response.status})`);
  }
}

export function StoreProvider({ initialState, children }: StoreProviderProps) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProjectStore(initialState);
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

        try {
          await persistProjectState(snapshot, keepalive);
          lastPersistedSignature = signature;
        } catch (error) {
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
