import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, Premissas, Custos, TankPhase, LocationKey, LocationData } from './types';
import { initialLocations } from './initialData';

interface AppState {
  activeLocation: LocationKey;
  locations: Record<string, LocationData>;

  // Derived data access for active location
  activeTanks: Tank[];
  activeBercarioLotes: BercarioLote[];
  activeRecriaLotes: RecriaLote[];
  activeEngordaLotes: EngordaLote[];
  activePremissas: Premissas;
  activeCustos: Custos;

  // Actions
  setLocation: (key: LocationKey) => void;
  updateTankPhase: (tankId: number, newPhase: TankPhase, subfase?: string) => void;
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

  // Phase color configuration
  phaseColors: Record<TankPhase, string>;
  setPhaseColor: (phase: TankPhase, color: string) => void;
}

function updateLocationInState(
  state: AppState,
  updater: (loc: LocationData) => Partial<LocationData>
): Partial<AppState> {
  const loc = state.locations[state.activeLocation];
  const updated = { ...loc, ...updater(loc) };
  const newLocations = { ...state.locations, [state.activeLocation]: updated };
  const derived = getDerivedState(newLocations, state.activeLocation);
  return { locations: newLocations, ...derived };
}

function getDerivedState(locations: Record<string, LocationData>, activeLocation: string) {
  const loc = locations[activeLocation];
  return {
    activeTanks: loc.tanks,
    activeBercarioLotes: loc.bercarioLotes,
    activeRecriaLotes: loc.recriaLotes,
    activeEngordaLotes: loc.engordaLotes,
    activePremissas: loc.premissas,
    activeCustos: loc.custos,
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeLocation: 'rondonia' as LocationKey,
      locations: initialLocations as Record<string, LocationData>,

      // These are set dynamically via getDerivedState
      activeTanks: initialLocations.rondonia.tanks,
      activeBercarioLotes: initialLocations.rondonia.bercarioLotes,
      activeRecriaLotes: initialLocations.rondonia.recriaLotes,
      activeEngordaLotes: initialLocations.rondonia.engordaLotes,
      activePremissas: initialLocations.rondonia.premissas,
      activeCustos: initialLocations.rondonia.custos,

      phaseColors: { bercario: '#94ba65', recria: '#f3fa6b', engorda: '#2563eb', vazio: '#52525b' },

      setLocation: (key: LocationKey) => {
        const state = get();
        const derived = getDerivedState(state.locations, key);
        set({ activeLocation: key, ...derived });
      },

      updateTankPhase: (tankId, newPhase, subfase) =>
        set((state) => {
          const loc = state.locations[state.activeLocation];
          const tank = loc.tanks.find((t) => t.id === tankId);
          if (!tank) return state;

          const updatedTanks = loc.tanks.map((t) =>
            t.id === tankId ? { ...t, phase: newPhase, subfase } : t
          );

          if (tank.phase === newPhase) {
            return updateLocationInState(state, () => ({ tanks: updatedTanks }));
          }

          const oldBercario = loc.bercarioLotes.find((l) => l.tankId === tankId);
          const oldRecria = loc.recriaLotes.find((l) => l.tankId === tankId);
          const oldEngorda = loc.engordaLotes.find((l) => l.tankId === tankId);
          const existing = oldBercario ?? oldRecria ?? oldEngorda;

          let bercarioLotes = loc.bercarioLotes.filter((l) => l.tankId !== tankId);
          let recriaLotes = loc.recriaLotes.filter((l) => l.tankId !== tankId);
          let engordaLotes = loc.engordaLotes.filter((l) => l.tankId !== tankId);

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
              bercarioLotes = [...bercarioLotes, {
                ...common,
                nome: oldBercario?.nome ?? '',
                peso_transferencia_kg: oldBercario?.peso_transferencia_kg ?? oldRecria?.peso_transferencia_kg ?? 0.1,
              }];
            } else if (newPhase === 'recria') {
              recriaLotes = [...recriaLotes, {
                ...common,
                peso_transferencia_kg: oldRecria?.peso_transferencia_kg ?? oldBercario?.peso_transferencia_kg ?? 0.7,
                periodo_meses: oldRecria?.periodo_meses ?? oldEngorda?.periodo_meses ?? 5,
              }];
            } else if (newPhase === 'engorda') {
              engordaLotes = [...engordaLotes, {
                ...common,
                modulo: oldEngorda?.modulo ?? subfase ?? '',
                conversao_alimentar: oldEngorda?.conversao_alimentar ?? 2,
                peso_final_kg_peixe: oldEngorda?.peso_final_kg_peixe ?? 2.5,
                periodo_meses: oldEngorda?.periodo_meses ?? oldRecria?.periodo_meses ?? 5,
              }];
            }
          }

          return updateLocationInState(state, () => ({
            tanks: updatedTanks,
            bercarioLotes,
            recriaLotes,
            engordaLotes,
          }));
        }),

      updateBercarioLote: (tankId, data) =>
        set((state) => updateLocationInState(state, (loc) => ({
          bercarioLotes: loc.bercarioLotes.map((l) =>
            l.tankId === tankId ? { ...l, ...data } : l
          ),
        }))),

      updateRecriaLote: (tankId, data) =>
        set((state) => updateLocationInState(state, (loc) => ({
          recriaLotes: loc.recriaLotes.map((l) =>
            l.tankId === tankId ? { ...l, ...data } : l
          ),
        }))),

      updateEngordaLote: (tankId, data) =>
        set((state) => updateLocationInState(state, (loc) => ({
          engordaLotes: loc.engordaLotes.map((l) =>
            l.tankId === tankId ? { ...l, ...data } : l
          ),
        }))),

      updatePremissas: (data) =>
        set((state) => updateLocationInState(state, (loc) => ({
          premissas: { ...loc.premissas, ...data },
        }))),

      updateCustos: (data) =>
        set((state) => updateLocationInState(state, (loc) => ({
          custos: { ...loc.custos, ...data },
        }))),

      addBercarioLote: (lote) =>
        set((state) => updateLocationInState(state, (loc) => ({
          bercarioLotes: [...loc.bercarioLotes, lote],
        }))),

      addRecriaLote: (lote) =>
        set((state) => updateLocationInState(state, (loc) => ({
          recriaLotes: [...loc.recriaLotes, lote],
        }))),

      addEngordaLote: (lote) =>
        set((state) => updateLocationInState(state, (loc) => ({
          engordaLotes: [...loc.engordaLotes, lote],
        }))),

      removeLoteForTank: (tankId) =>
        set((state) => updateLocationInState(state, (loc) => ({
          bercarioLotes: loc.bercarioLotes.filter((l) => l.tankId !== tankId),
          recriaLotes: loc.recriaLotes.filter((l) => l.tankId !== tankId),
          engordaLotes: loc.engordaLotes.filter((l) => l.tankId !== tankId),
        }))),

      addTank: (tank) =>
        set((state) => updateLocationInState(state, (loc) => ({
          tanks: [...loc.tanks, tank],
        }))),

      removeTank: (tankId) =>
        set((state) => updateLocationInState(state, (loc) => ({
          tanks: loc.tanks.filter((t) => t.id !== tankId),
          bercarioLotes: loc.bercarioLotes.filter((l) => l.tankId !== tankId),
          recriaLotes: loc.recriaLotes.filter((l) => l.tankId !== tankId),
          engordaLotes: loc.engordaLotes.filter((l) => l.tankId !== tankId),
        }))),

      setPhaseColor: (phase, color) => set((s) => ({ phaseColors: { ...s.phaseColors, [phase]: color } })),
    }),
    {
      name: 'piscicultura-storage',
      version: 4,
      migrate: (persistedState, version) => {
        if (version === 3) {
          const state = persistedState as AppState;
          const rondoniaCustos = state.locations?.rondonia?.custos;
          const isOldDefaults =
            rondoniaCustos?.receita_venda === 450000 &&
            rondoniaCustos?.custo_racao === 180000 &&
            rondoniaCustos?.outras_despesas === 45000;
          if (isOldDefaults && state.locations?.rondonia) {
            state.locations.rondonia.custos = { ...initialLocations.rondonia.custos };
            const derived = getDerivedState(state.locations, state.activeLocation);
            return { ...state, ...derived };
          }
          return state;
        }
        if (version === 0 || version === 1 || version === 2) {
          // Migration from v0/v1 (flat structure) to v2 (multi-location)
          const state = persistedState as Record<string, unknown>;
          const rondoniaData: LocationData = {
            tanks: (state.tanks as Tank[]) ?? initialLocations.rondonia.tanks,
            bercarioLotes: (state.bercarioLotes as BercarioLote[]) ?? initialLocations.rondonia.bercarioLotes,
            recriaLotes: (state.recriaLotes as RecriaLote[]) ?? initialLocations.rondonia.recriaLotes,
            engordaLotes: (state.engordaLotes as EngordaLote[]) ?? initialLocations.rondonia.engordaLotes,
            premissas: (state.premissas as Premissas) ?? initialLocations.rondonia.premissas,
            custos: (state.custos as Custos) ?? initialLocations.rondonia.custos,
          };
          const locations: Record<string, LocationData> = {
            rondonia: rondoniaData,
            acre: initialLocations.acre,
          };
          const derived = getDerivedState(locations, 'rondonia');
          return {
            activeLocation: 'rondonia' as LocationKey,
            locations,
            ...derived,
            phaseColors: { bercario: '#94ba65', recria: '#f3fa6b', engorda: '#2563eb', vazio: '#52525b' },
          } as AppState;
        }
        return persistedState as AppState;
      },
    }
  )
);