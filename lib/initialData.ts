import type { Tank, BercarioLote, RecriaLote, EngordaLote, Premissas, Custos } from './types';

export const initialTanks: Tank[] = [
  { id: 1,  area_m2: 1600,  area_ha: 0.16, phase: 'recria' },
  { id: 2,  area_m2: 2100,  area_ha: 0.21, phase: 'recria' },
  { id: 3,  area_m2: 23000, area_ha: 2.3,  phase: 'engorda', subfase: 'Módulo 1' },
  { id: 4,  area_m2: 30000, area_ha: 3.0,  phase: 'engorda', subfase: 'Módulo 2' },
  { id: 5,  area_m2: 5000,  area_ha: 0.5,  phase: 'recria' },
  { id: 6,  area_m2: 5000,  area_ha: 0.5,  phase: 'recria' },
  { id: 7,  area_m2: 1500,  area_ha: 0.15, phase: 'recria' },
  { id: 8,  area_m2: 5000,  area_ha: 0.5,  phase: 'recria' },
  { id: 9,  area_m2: 2000,  area_ha: 0.2,  phase: 'bercario', subfase: 'Berçário 1' },
  { id: 10, area_m2: 5000,  area_ha: 0.5,  phase: 'recria' },
  { id: 11, area_m2: 16000, area_ha: 1.6,  phase: 'engorda', subfase: 'Módulo 3' },
  { id: 12, area_m2: 4000,  area_ha: 0.4,  phase: 'bercario', subfase: 'Berçário 2' },
  { id: 13, area_m2: 3000,  area_ha: 0.3,  phase: 'recria' },
  { id: 14, area_m2: 22000, area_ha: 2.2,  phase: 'engorda', subfase: 'Módulo 4' },
  { id: 15, area_m2: 5000,  area_ha: 0.5,  phase: 'recria' },
  { id: 16, area_m2: 6000,  area_ha: 0.6,  phase: 'recria' },
  { id: 17, area_m2: 25000, area_ha: 2.5,  phase: 'engorda', subfase: 'Módulo 5' },
];

export const initialBercarioLotes: BercarioLote[] = [
  {
    tankId: 9,
    nome: 'Berçário 1',
    qtd_peixes: 15000,
    peso_entrada_kg: 45,
    peso_ganhar_kg: 1455,
    racao_periodo_kg: 1455,
    peso_total_kg: 1500,
    densidade_kg_m2: 0.75,
    peso_transferencia_kg: 0.1,
    racao_dia_sc: 0.4656,
    racao_mes_sc: 11.64,
    racao_total_sc: 58.2,
  },
  {
    tankId: 12,
    nome: 'Berçário 2',
    qtd_peixes: 25000,
    peso_entrada_kg: 75,
    peso_ganhar_kg: 2425,
    racao_periodo_kg: 2425,
    peso_total_kg: 2500,
    densidade_kg_m2: 0.625,
    peso_transferencia_kg: 0.1,
    racao_dia_sc: 0.776,
    racao_mes_sc: 19.4,
    racao_total_sc: 97,
  },
];

export const initialRecriaLotes: RecriaLote[] = [
  { tankId: 1,  qtd_peixes: 3200,  peso_entrada_kg: 320,  peso_ganhar_kg: 1920,  racao_periodo_kg: 2688,  peso_total_kg: 2240,  densidade_kg_m2: 1.4,   peso_transferencia_kg: 0.7, racao_dia_sc: 0.8602, racao_mes_sc: 21.5,  racao_total_sc: 107.5, periodo_meses: 5 },
  { tankId: 2,  qtd_peixes: 4200,  peso_entrada_kg: 420,  peso_ganhar_kg: 2520,  racao_periodo_kg: 3528,  peso_total_kg: 2940,  densidade_kg_m2: 1.4,   peso_transferencia_kg: 0.7, racao_dia_sc: 1.129,  racao_mes_sc: 28.22, racao_total_sc: 141.1, periodo_meses: 5 },
  { tankId: 5,  qtd_peixes: 5000,  peso_entrada_kg: 500,  peso_ganhar_kg: 3000,  racao_periodo_kg: 4200,  peso_total_kg: 3500,  densidade_kg_m2: 0.7,   peso_transferencia_kg: 0.7, racao_dia_sc: 1.344,  racao_mes_sc: 33.6,  racao_total_sc: 168,   periodo_meses: 5 },
  { tankId: 6,  qtd_peixes: 5000,  peso_entrada_kg: 500,  peso_ganhar_kg: 3000,  racao_periodo_kg: 4200,  peso_total_kg: 3500,  densidade_kg_m2: 0.7,   peso_transferencia_kg: 0.7, racao_dia_sc: 1.344,  racao_mes_sc: 33.6,  racao_total_sc: 168,   periodo_meses: 5 },
  { tankId: 7,  qtd_peixes: 1500,  peso_entrada_kg: 150,  peso_ganhar_kg: 900,   racao_periodo_kg: 1260,  peso_total_kg: 1050,  densidade_kg_m2: 0.7,   peso_transferencia_kg: 0.7, racao_dia_sc: 0.4032, racao_mes_sc: 10.08, racao_total_sc: 50.4,  periodo_meses: 5 },
  { tankId: 8,  qtd_peixes: 5000,  peso_entrada_kg: 500,  peso_ganhar_kg: 3000,  racao_periodo_kg: 4200,  peso_total_kg: 3500,  densidade_kg_m2: 0.7,   peso_transferencia_kg: 0.7, racao_dia_sc: 1.344,  racao_mes_sc: 33.6,  racao_total_sc: 168,   periodo_meses: 5 },
  { tankId: 10, qtd_peixes: 5000,  peso_entrada_kg: 500,  peso_ganhar_kg: 3000,  racao_periodo_kg: 4200,  peso_total_kg: 3500,  densidade_kg_m2: 0.7,   peso_transferencia_kg: 0.7, racao_dia_sc: 1.344,  racao_mes_sc: 33.6,  racao_total_sc: 168,   periodo_meses: 5 },
  { tankId: 13, qtd_peixes: 3000,  peso_entrada_kg: 300,  peso_ganhar_kg: 1800,  racao_periodo_kg: 2520,  peso_total_kg: 2100,  densidade_kg_m2: 0.7,   peso_transferencia_kg: 0.7, racao_dia_sc: 0.8064, racao_mes_sc: 20.16, racao_total_sc: 100.8, periodo_meses: 5 },
  { tankId: 15, qtd_peixes: 5000,  peso_entrada_kg: 500,  peso_ganhar_kg: 3000,  racao_periodo_kg: 4200,  peso_total_kg: 3500,  densidade_kg_m2: 0.7,   peso_transferencia_kg: 0.7, racao_dia_sc: 1.344,  racao_mes_sc: 33.6,  racao_total_sc: 168,   periodo_meses: 5 },
  { tankId: 16, qtd_peixes: 6500,  peso_entrada_kg: 650,  peso_ganhar_kg: 3900,  racao_periodo_kg: 5460,  peso_total_kg: 4550,  densidade_kg_m2: 0.758, peso_transferencia_kg: 0.7, racao_dia_sc: 1.7472, racao_mes_sc: 43.68, racao_total_sc: 218.4, periodo_meses: 5 },
];

export const initialEngordaLotes: EngordaLote[] = [
  { tankId: 3,  modulo: 'Módulo 1', qtd_peixes: 6000, peso_entrada_kg: 4200, peso_ganhar_kg: 10800, racao_periodo_kg: 21600, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 15000, densidade_kg_m2: 0.6522, racao_dia_sc: 6.912,  racao_mes_sc: 172.8, racao_total_sc: 864,  periodo_meses: 5 },
  { tankId: 4,  modulo: 'Módulo 2', qtd_peixes: 9000, peso_entrada_kg: 6300, peso_ganhar_kg: 16200, racao_periodo_kg: 32400, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 22500, densidade_kg_m2: 0.75,   racao_dia_sc: 10.368, racao_mes_sc: 259.2, racao_total_sc: 1296, periodo_meses: 5 },
  { tankId: 11, modulo: 'Módulo 3', qtd_peixes: 5000, peso_entrada_kg: 3500, peso_ganhar_kg: 9000,  racao_periodo_kg: 18000, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 12500, densidade_kg_m2: 0.7813, racao_dia_sc: 5.76,   racao_mes_sc: 144,   racao_total_sc: 720,  periodo_meses: 5 },
  { tankId: 14, modulo: 'Módulo 4', qtd_peixes: 6000, peso_entrada_kg: 4200, peso_ganhar_kg: 10800, racao_periodo_kg: 21600, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 15000, densidade_kg_m2: 0.6818, racao_dia_sc: 6.912,  racao_mes_sc: 172.8, racao_total_sc: 864,  periodo_meses: 5 },
  { tankId: 17, modulo: 'Módulo 5', qtd_peixes: 6000, peso_entrada_kg: 4200, peso_ganhar_kg: 10800, racao_periodo_kg: 21600, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 15000, densidade_kg_m2: 0.6,    racao_dia_sc: 6.912,  racao_mes_sc: 172.8, racao_total_sc: 864,  periodo_meses: 5 },
];

export const initialPremissas: Premissas = {
  producao_anual: 160000,
  conversao_alimentar: 1.8,
  ciclos_ano: 2.6,
  preco_venda: 9,
  peso_final_engorda: 2.5,
  peso_transfer_recria: 0.7,
  peso_transfer_bercario: 0.1,
  periodo_engorda: 5,
  periodo_recria: 5,
};

export const initialCustos: Custos = {
  receita_venda: 1440000,
  custo_racao: 750000,
  outras_despesas: 250000,
};
