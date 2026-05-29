import type { Tank, BercarioLote, RecriaLote, EngordaLote, Premissas, LocationData } from './types';

const initialTanksRondonia: Tank[] = [
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

const initialBercarioLotesRondonia: BercarioLote[] = [
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

const initialRecriaLotesRondonia: RecriaLote[] = [
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

const initialEngordaLotesRondonia: EngordaLote[] = [
  { tankId: 3,  modulo: 'Módulo 1', qtd_peixes: 6000, peso_entrada_kg: 4200, peso_ganhar_kg: 10800, racao_periodo_kg: 21600, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 15000, densidade_kg_m2: 0.6522, racao_dia_sc: 6.912,  racao_mes_sc: 172.8, racao_total_sc: 864,  periodo_meses: 5 },
  { tankId: 4,  modulo: 'Módulo 2', qtd_peixes: 9000, peso_entrada_kg: 6300, peso_ganhar_kg: 16200, racao_periodo_kg: 32400, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 22500, densidade_kg_m2: 0.75,   racao_dia_sc: 10.368, racao_mes_sc: 259.2, racao_total_sc: 1296, periodo_meses: 5 },
  { tankId: 11, modulo: 'Módulo 3', qtd_peixes: 5000, peso_entrada_kg: 3500, peso_ganhar_kg: 9000,  racao_periodo_kg: 18000, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 12500, densidade_kg_m2: 0.7813, racao_dia_sc: 5.76,   racao_mes_sc: 144,   racao_total_sc: 720,  periodo_meses: 5 },
  { tankId: 14, modulo: 'Módulo 4', qtd_peixes: 6000, peso_entrada_kg: 4200, peso_ganhar_kg: 10800, racao_periodo_kg: 21600, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 15000, densidade_kg_m2: 0.6818, racao_dia_sc: 6.912,  racao_mes_sc: 172.8, racao_total_sc: 864,  periodo_meses: 5 },
  { tankId: 17, modulo: 'Módulo 5', qtd_peixes: 6000, peso_entrada_kg: 4200, peso_ganhar_kg: 10800, racao_periodo_kg: 21600, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 15000, densidade_kg_m2: 0.6,    racao_dia_sc: 6.912,  racao_mes_sc: 172.8, racao_total_sc: 864,  periodo_meses: 5 },
];

const initialPremissasRondonia: Premissas = {
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

const initialCustosRondonia = {
  receita_venda: 1440000,
  lancamentos: [],
};

// Acre — dados próprios, distintos de Rondônia
const initialTanksAcre: Tank[] = [
  { id: 1,  area_m2: 1200,  area_ha: 0.12, phase: 'bercario', subfase: 'Berçário A1' },
  { id: 2,  area_m2: 1800,  area_ha: 0.18, phase: 'recria' },
  { id: 3,  area_m2: 2500,  area_ha: 0.25, phase: 'recria' },
  { id: 4,  area_m2: 8000,  area_ha: 0.8,  phase: 'engorda', subfase: 'Módulo 1' },
  { id: 5,  area_m2: 10000, area_ha: 1.0,  phase: 'engorda', subfase: 'Módulo 2' },
  { id: 6,  area_m2: 1500,  area_ha: 0.15, phase: 'recria' },
  { id: 7,  area_m2: 3000,  area_ha: 0.3,  phase: 'bercario', subfase: 'Berçário A2' },
  { id: 8,  area_m2: 6000,  area_ha: 0.6,  phase: 'recria' },
  { id: 9,  area_m2: 12000, area_ha: 1.2,  phase: 'engorda', subfase: 'Módulo 3' },
  { id: 10, area_m2: 4000,  area_ha: 0.4,  phase: 'recria' },
  { id: 11, area_m2: 18000, area_ha: 1.8,  phase: 'engorda', subfase: 'Módulo 4' },
  { id: 12, area_m2: 2000,  area_ha: 0.2,  phase: 'vazio' },
];

const initialBercarioLotesAcre: BercarioLote[] = [
  {
    tankId: 1,
    nome: 'Berçário A1',
    qtd_peixes: 10000,
    peso_entrada_kg: 30,
    peso_ganhar_kg: 970,
    racao_periodo_kg: 970,
    peso_total_kg: 1000,
    densidade_kg_m2: 0.833,
    peso_transferencia_kg: 0.1,
    racao_dia_sc: 0.3104,
    racao_mes_sc: 7.76,
    racao_total_sc: 38.8,
  },
  {
    tankId: 7,
    nome: 'Berçário A2',
    qtd_peixes: 18000,
    peso_entrada_kg: 54,
    peso_ganhar_kg: 1746,
    racao_periodo_kg: 1746,
    peso_total_kg: 1800,
    densidade_kg_m2: 0.6,
    peso_transferencia_kg: 0.1,
    racao_dia_sc: 0.5587,
    racao_mes_sc: 13.97,
    racao_total_sc: 69.84,
  },
];

const initialRecriaLotesAcre: RecriaLote[] = [
  { tankId: 2,  qtd_peixes: 2500, peso_entrada_kg: 250,  peso_ganhar_kg: 1500, racao_periodo_kg: 2100, peso_total_kg: 1750, densidade_kg_m2: 0.972, peso_transferencia_kg: 0.7, racao_dia_sc: 0.672,  racao_mes_sc: 16.8,  racao_total_sc: 84,   periodo_meses: 5 },
  { tankId: 3,  qtd_peixes: 2800, peso_entrada_kg: 280,  peso_ganhar_kg: 1680, racao_periodo_kg: 2352, peso_total_kg: 1960, densidade_kg_m2: 0.784, peso_transferencia_kg: 0.7, racao_dia_sc: 0.753,  racao_mes_sc: 18.82, racao_total_sc: 94.08, periodo_meses: 5 },
  { tankId: 6,  qtd_peixes: 1500, peso_entrada_kg: 150,  peso_ganhar_kg: 900,  racao_periodo_kg: 1260, peso_total_kg: 1050, densidade_kg_m2: 0.7,   peso_transferencia_kg: 0.7, racao_dia_sc: 0.4032, racao_mes_sc: 10.08, racao_total_sc: 50.4,  periodo_meses: 5 },
  { tankId: 8,  qtd_peixes: 4000, peso_entrada_kg: 400,  peso_ganhar_kg: 2400, racao_periodo_kg: 3360, peso_total_kg: 2800, densidade_kg_m2: 0.467, peso_transferencia_kg: 0.7, racao_dia_sc: 1.0752, racao_mes_sc: 26.88, racao_total_sc: 134.4, periodo_meses: 5 },
  { tankId: 10, qtd_peixes: 3500, peso_entrada_kg: 350,  peso_ganhar_kg: 2100, racao_periodo_kg: 2940, peso_total_kg: 2450, densidade_kg_m2: 0.613, peso_transferencia_kg: 0.7, racao_dia_sc: 0.9408, racao_mes_sc: 23.52, racao_total_sc: 117.6, periodo_meses: 5 },
];

const initialEngordaLotesAcre: EngordaLote[] = [
  { tankId: 4,  modulo: 'Módulo 1', qtd_peixes: 4000, peso_entrada_kg: 2800, peso_ganhar_kg: 7200,  racao_periodo_kg: 14400, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 10000, densidade_kg_m2: 1.25,   racao_dia_sc: 4.608,  racao_mes_sc: 115.2, racao_total_sc: 576,  periodo_meses: 5 },
  { tankId: 5,  modulo: 'Módulo 2', qtd_peixes: 5500, peso_entrada_kg: 3850, peso_ganhar_kg: 9900,  racao_periodo_kg: 19800, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 13750, densidade_kg_m2: 1.375,  racao_dia_sc: 6.336,  racao_mes_sc: 158.4, racao_total_sc: 792,  periodo_meses: 5 },
  { tankId: 9,  modulo: 'Módulo 3', qtd_peixes: 4500, peso_entrada_kg: 3150, peso_ganhar_kg: 8100,  racao_periodo_kg: 16200, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 11250, densidade_kg_m2: 0.9375, racao_dia_sc: 5.184,  racao_mes_sc: 129.6, racao_total_sc: 648,  periodo_meses: 5 },
  { tankId: 11, modulo: 'Módulo 4', qtd_peixes: 5000, peso_entrada_kg: 3500, peso_ganhar_kg: 9000,  racao_periodo_kg: 18000, conversao_alimentar: 2, peso_final_kg_peixe: 2.5, peso_total_kg: 12500, densidade_kg_m2: 0.694,  racao_dia_sc: 5.76,   racao_mes_sc: 144,   racao_total_sc: 720,  periodo_meses: 5 },
];

const initialPremissasAcre: Premissas = {
  producao_anual: 120000,
  conversao_alimentar: 2.0,
  ciclos_ano: 2.4,
  preco_venda: 10,
  peso_final_engorda: 2.5,
  peso_transfer_recria: 0.7,
  peso_transfer_bercario: 0.1,
  periodo_engorda: 5,
  periodo_recria: 5,
};

const initialCustosAcre = {
  receita_venda: 380000,
  lancamentos: [],
};

export const initialLocations: Record<string, LocationData> = {
  rondonia: {
    tanks: initialTanksRondonia,
    bercarioLotes: initialBercarioLotesRondonia,
    recriaLotes: initialRecriaLotesRondonia,
    engordaLotes: initialEngordaLotesRondonia,
    premissas: initialPremissasRondonia,
    custos: initialCustosRondonia,
  },
  acre: {
    tanks: initialTanksAcre,
    bercarioLotes: initialBercarioLotesAcre,
    recriaLotes: initialRecriaLotesAcre,
    engordaLotes: initialEngordaLotesAcre,
    premissas: initialPremissasAcre,
    custos: initialCustosAcre,
  },
};

// Backward-compatible exports for migration
export const initialTanks = initialTanksRondonia;
export const initialBercarioLotes = initialBercarioLotesRondonia;
export const initialRecriaLotes = initialRecriaLotesRondonia;
export const initialEngordaLotes = initialEngordaLotesRondonia;
export const initialPremissas = initialPremissasRondonia;
export const initialCustos = initialCustosRondonia;

