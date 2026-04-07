export type TankPhase = 'bercario' | 'recria' | 'engorda' | 'vazio';

export interface Tank {
  id: number;
  area_m2: number;
  area_ha: number;
  phase: TankPhase;
  subfase?: string;
}

export interface BercarioLote {
  tankId: number;
  nome: string;
  qtd_peixes: number;
  peso_entrada_kg: number;
  peso_ganhar_kg: number;
  racao_periodo_kg: number;
  peso_total_kg: number;
  densidade_kg_m2: number;
  peso_transferencia_kg: number;
  racao_dia_sc: number;
  racao_mes_sc: number;
  racao_total_sc: number;
}

export interface RecriaLote {
  tankId: number;
  qtd_peixes: number;
  peso_entrada_kg: number;
  peso_ganhar_kg: number;
  racao_periodo_kg: number;
  peso_total_kg: number;
  densidade_kg_m2: number;
  peso_transferencia_kg: number;
  racao_dia_sc: number;
  racao_mes_sc: number;
  racao_total_sc: number;
  periodo_meses: number;
}

export interface EngordaLote {
  tankId: number;
  modulo: string;
  qtd_peixes: number;
  peso_entrada_kg: number;
  peso_ganhar_kg: number;
  racao_periodo_kg: number;
  conversao_alimentar: number;
  peso_final_kg_peixe: number;
  peso_total_kg: number;
  densidade_kg_m2: number;
  racao_dia_sc: number;
  racao_mes_sc: number;
  racao_total_sc: number;
  periodo_meses: number;
}

export interface Premissas {
  producao_anual: number;
  conversao_alimentar: number;
  ciclos_ano: number;
  preco_venda: number;
  peso_final_engorda: number;
  peso_transfer_recria: number;
  peso_transfer_bercario: number;
  periodo_engorda: number;
  periodo_recria: number;
}

export interface Custos {
  receita_venda: number;
  custo_racao: number;
  outras_despesas: number;
}

export const PHASE_LABELS: Record<TankPhase, string> = {
  bercario: 'Berçário',
  recria: 'Recria',
  engorda: 'Engorda',
  vazio: 'Vazio',
};

export const PHASE_COLORS: Record<TankPhase, string> = {
  bercario: '#3b82f6',
  recria: '#22c55e',
  engorda: '#f59e0b',
  vazio: '#475569',
};
