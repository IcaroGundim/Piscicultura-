import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tank, BercarioLote, RecriaLote, EngordaLote, Premissas, Custos, TankPhase } from './types';
import {
  initialTanks,
  initialBercarioLotes,
  initialRecriaLotes,
  initialEngordaLotes,
  initialPremissas,
  initialCustos,
} from './initialData';

interface AppState {
  tanks: Tank[];
  bercarioLotes: BercarioLote[];
  recriaLotes: RecriaLote[];
  engordaLotes: EngordaLote[];
  premissas: Premissas;
  custos: Custos;

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
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      tanks: initialTanks,
      bercarioLotes: initialBercarioLotes,
      recriaLotes: initialRecriaLotes,
      engordaLotes: initialEngordaLotes,
      premissas: initialPremissas,
      custos: initialCustos,

      updateTankPhase: (tankId, newPhase, subfase) =>
        set((state) => {
          const tank = state.tanks.find((t) => t.id === tankId);
          if (!tank) return state;

          const updatedTanks = state.tanks.map((t) =>
            t.id === tankId ? { ...t, phase: newPhase, subfase } : t
          );

          // If phase didn't actually change, just update subfase
          if (tank.phase === newPhase) {
            return { tanks: updatedTanks };
          }

          // Find existing lote in the OLD phase
          const oldBercario = state.bercarioLotes.find((l) => l.tankId === tankId);
          const oldRecria = state.recriaLotes.find((l) => l.tankId === tankId);
          const oldEngorda = state.engordaLotes.find((l) => l.tankId === tankId);
          const existing = oldBercario || oldRecria || oldEngorda;

          // Remove from ALL phase arrays (old phase cleanup)
          let bercarioLotes = state.bercarioLotes.filter((l) => l.tankId !== tankId);
          let recriaLotes = state.recriaLotes.filter((l) => l.tankId !== tankId);
          let engordaLotes = state.engordaLotes.filter((l) => l.tankId !== tankId);

          // If there was an existing lote, migrate it to the new phase
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
                peso_transferencia_kg: (oldBercario ?? oldRecria)?.peso_transferencia_kg ?? 0.1,
              }];
            } else if (newPhase === 'recria') {
              recriaLotes = [...recriaLotes, {
                ...common,
                peso_transferencia_kg: (oldRecria ?? oldBercario)?.peso_transferencia_kg ?? 0.7,
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

          return { tanks: updatedTanks, bercarioLotes, recriaLotes, engordaLotes };
        }),

      updateBercarioLote: (tankId, data) =>
        set((state) => ({
          bercarioLotes: state.bercarioLotes.map((l) =>
            l.tankId === tankId ? { ...l, ...data } : l
          ),
        })),

      updateRecriaLote: (tankId, data) =>
        set((state) => ({
          recriaLotes: state.recriaLotes.map((l) =>
            l.tankId === tankId ? { ...l, ...data } : l
          ),
        })),

      updateEngordaLote: (tankId, data) =>
        set((state) => ({
          engordaLotes: state.engordaLotes.map((l) =>
            l.tankId === tankId ? { ...l, ...data } : l
          ),
        })),

      updatePremissas: (data) =>
        set((state) => ({ premissas: { ...state.premissas, ...data } })),

      updateCustos: (data) =>
        set((state) => ({ custos: { ...state.custos, ...data } })),

      addBercarioLote: (lote) =>
        set((state) => ({ bercarioLotes: [...state.bercarioLotes, lote] })),

      addRecriaLote: (lote) =>
        set((state) => ({ recriaLotes: [...state.recriaLotes, lote] })),

      addEngordaLote: (lote) =>
        set((state) => ({ engordaLotes: [...state.engordaLotes, lote] })),

      removeLoteForTank: (tankId) =>
        set((state) => ({
          bercarioLotes: state.bercarioLotes.filter((l) => l.tankId !== tankId),
          recriaLotes: state.recriaLotes.filter((l) => l.tankId !== tankId),
          engordaLotes: state.engordaLotes.filter((l) => l.tankId !== tankId),
        })),
    }),
    { name: 'piscicultura-storage' }
  )
);
