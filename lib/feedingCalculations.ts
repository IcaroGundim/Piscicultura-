import type { BercarioLote, EngordaLote, Premissas, RecriaLote, Tank } from './types';

const BAG_WEIGHT_KG = 25;
const FEEDING_DAYS_PER_MONTH = 25;
const DEFAULT_PERIOD_MONTHS = 5;
const BERCARIO_FCA = 1;
const RECRIA_FCA = 1.4;

function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function round(value: number, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(finite(value) * factor) / factor;
}

function feedProjection(racaoPeriodoKg: number, periodoMeses: number) {
  const safePeriodo = Math.max(1, finite(periodoMeses, DEFAULT_PERIOD_MONTHS));
  const racaoTotalSc = racaoPeriodoKg / BAG_WEIGHT_KG;
  const racaoMesSc = racaoTotalSc / safePeriodo;
  const racaoDiaSc = racaoMesSc / FEEDING_DAYS_PER_MONTH;

  return {
    racao_dia_sc: round(racaoDiaSc),
    racao_mes_sc: round(racaoMesSc, 2),
    racao_total_sc: round(racaoTotalSc, 3),
  };
}

function densityKgM3(pesoTotalKg: number, tank?: Tank) {
  // O cadastro atual tem area, mas nao profundidade. Na pratica isso assume 1m de coluna d'agua.
  const volumeM3 = tank?.area_m2 ?? 0;
  return volumeM3 > 0 ? round(pesoTotalKg / volumeM3, 4) : 0;
}

export function calculateBercarioLote(
  lote: BercarioLote,
  tank?: Tank
): BercarioLote {
  const qtdPeixes = Math.max(0, finite(lote.qtd_peixes));
  const pesoEntradaKg = Math.max(0, finite(lote.peso_entrada_kg));
  const pesoTotalKg = qtdPeixes * Math.max(0, finite(lote.peso_transferencia_kg));
  const pesoGanharKg = Math.max(0, pesoTotalKg - pesoEntradaKg);
  const racaoPeriodoKg = pesoGanharKg * BERCARIO_FCA;

  return {
    ...lote,
    qtd_peixes: Math.round(qtdPeixes),
    peso_ganhar_kg: round(pesoGanharKg, 3),
    racao_periodo_kg: round(racaoPeriodoKg, 3),
    peso_total_kg: round(pesoTotalKg, 3),
    densidade_kg_m2: densityKgM3(pesoTotalKg, tank),
    ...feedProjection(racaoPeriodoKg, DEFAULT_PERIOD_MONTHS),
  };
}

export function calculateRecriaLote(
  lote: RecriaLote,
  tank?: Tank,
  premissas?: Premissas
): RecriaLote {
  const qtdPeixes = Math.max(0, finite(lote.qtd_peixes));
  const pesoEntradaKg = Math.max(0, finite(lote.peso_entrada_kg));
  const periodoMeses = finite(lote.periodo_meses, premissas?.periodo_recria ?? DEFAULT_PERIOD_MONTHS);
  const pesoTotalKg = qtdPeixes * Math.max(0, finite(lote.peso_transferencia_kg));
  const pesoGanharKg = Math.max(0, pesoTotalKg - pesoEntradaKg);
  const racaoPeriodoKg = pesoGanharKg * RECRIA_FCA;

  return {
    ...lote,
    qtd_peixes: Math.round(qtdPeixes),
    periodo_meses: Math.max(1, Math.round(periodoMeses)),
    peso_ganhar_kg: round(pesoGanharKg, 3),
    racao_periodo_kg: round(racaoPeriodoKg, 3),
    peso_total_kg: round(pesoTotalKg, 3),
    densidade_kg_m2: densityKgM3(pesoTotalKg, tank),
    ...feedProjection(racaoPeriodoKg, periodoMeses),
  };
}

export function calculateEngordaLote(
  lote: EngordaLote,
  tank?: Tank,
  premissas?: Premissas
): EngordaLote {
  const qtdPeixes = Math.max(0, finite(lote.qtd_peixes));
  const pesoEntradaKg = Math.max(0, finite(lote.peso_entrada_kg));
  const periodoMeses = finite(lote.periodo_meses, premissas?.periodo_engorda ?? DEFAULT_PERIOD_MONTHS);
  const pesoFinalKgPeixe = Math.max(0, finite(lote.peso_final_kg_peixe, premissas?.peso_final_engorda ?? 0));
  const conversaoAlimentar = Math.max(0, finite(lote.conversao_alimentar, premissas?.conversao_alimentar ?? 0));
  const pesoTotalKg = qtdPeixes * pesoFinalKgPeixe;
  const pesoGanharKg = Math.max(0, pesoTotalKg - pesoEntradaKg);
  const racaoPeriodoKg = pesoGanharKg * conversaoAlimentar;

  return {
    ...lote,
    qtd_peixes: Math.round(qtdPeixes),
    periodo_meses: Math.max(1, Math.round(periodoMeses)),
    peso_final_kg_peixe: round(pesoFinalKgPeixe, 3),
    conversao_alimentar: round(conversaoAlimentar, 3),
    peso_ganhar_kg: round(pesoGanharKg, 3),
    racao_periodo_kg: round(racaoPeriodoKg, 3),
    peso_total_kg: round(pesoTotalKg, 3),
    densidade_kg_m2: densityKgM3(pesoTotalKg, tank),
    ...feedProjection(racaoPeriodoKg, periodoMeses),
  };
}
