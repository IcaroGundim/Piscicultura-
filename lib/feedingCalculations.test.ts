import { describe, it, expect } from 'vitest';
import {
  calculateBercarioLote,
  calculateRecriaLote,
  calculateEngordaLote,
} from './feedingCalculations';
import type {
  BercarioLote,
  EngordaLote,
  Premissas,
  RecriaLote,
  Tank,
} from './types';

function tank(area_m2: number): Tank {
  return { id: 1, area_m2, area_ha: area_m2 / 10000, phase: 'vazio' };
}

const premissas: Premissas = {
  producao_anual: 0,
  conversao_alimentar: 1.8,
  ciclos_ano: 2,
  preco_venda: 9,
  peso_final_engorda: 2.5,
  peso_transfer_recria: 0.7,
  peso_transfer_bercario: 0.1,
  periodo_engorda: 5,
  periodo_recria: 5,
};

const baseBercario: BercarioLote = {
  tankId: 1,
  nome: 'B1',
  qtd_peixes: 15000,
  peso_entrada_kg: 45,
  peso_ganhar_kg: 0,
  racao_periodo_kg: 0,
  peso_total_kg: 0,
  densidade_kg_m2: 0,
  peso_transferencia_kg: 0.1,
  racao_dia_sc: 0,
  racao_mes_sc: 0,
  racao_total_sc: 0,
};

describe('calculateBercarioLote', () => {
  it('calcula peso, ração e densidade (FCA=1, período padrão 5 meses)', () => {
    const result = calculateBercarioLote(baseBercario, tank(2000));
    // pesoTotal = 15000 * 0.1 = 1500; ganho = 1500 - 45 = 1455; ração = 1455 * 1
    expect(result.peso_total_kg).toBe(1500);
    expect(result.peso_ganhar_kg).toBe(1455);
    expect(result.racao_periodo_kg).toBe(1455);
    // projeção: total = 1455/25 = 58.2; mês = /5 = 11.64; dia = /25 = 0.4656
    expect(result.racao_total_sc).toBe(58.2);
    expect(result.racao_mes_sc).toBe(11.64);
    expect(result.racao_dia_sc).toBe(0.4656);
    // densidade = pesoTotal / area = 1500 / 2000
    expect(result.densidade_kg_m2).toBe(0.75);
  });

  it('zera valores com entradas inválidas e não fica negativo', () => {
    const result = calculateBercarioLote(
      { ...baseBercario, qtd_peixes: Number.NaN, peso_entrada_kg: 999999 },
      tank(2000)
    );
    expect(result.qtd_peixes).toBe(0);
    expect(result.peso_total_kg).toBe(0);
    expect(result.peso_ganhar_kg).toBe(0);
    expect(result.racao_periodo_kg).toBe(0);
  });

  it('densidade 0 quando não há tanque/área', () => {
    expect(calculateBercarioLote(baseBercario).densidade_kg_m2).toBe(0);
    expect(calculateBercarioLote(baseBercario, tank(0)).densidade_kg_m2).toBe(0);
  });
});

describe('calculateRecriaLote', () => {
  const baseRecria: RecriaLote = {
    tankId: 1,
    qtd_peixes: 3200,
    peso_entrada_kg: 320,
    peso_ganhar_kg: 0,
    racao_periodo_kg: 0,
    peso_total_kg: 0,
    densidade_kg_m2: 0,
    peso_transferencia_kg: 0.7,
    racao_dia_sc: 0,
    racao_mes_sc: 0,
    racao_total_sc: 0,
    periodo_meses: 5,
  };

  it('aplica FCA de recria (1.4) e usa o período informado', () => {
    const result = calculateRecriaLote(baseRecria, tank(1600), premissas);
    // pesoTotal = 3200 * 0.7 = 2240; ganho = 2240 - 320 = 1920; ração = 1920 * 1.4 = 2688
    expect(result.peso_total_kg).toBe(2240);
    expect(result.peso_ganhar_kg).toBe(1920);
    expect(result.racao_periodo_kg).toBe(2688);
    // total = 2688/25 = 107.52; mês = /5 = 21.504 -> 21.5; dia = 21.504/25 -> 0.8602
    expect(result.racao_total_sc).toBe(107.52);
    expect(result.racao_mes_sc).toBe(21.5);
    expect(result.racao_dia_sc).toBe(0.8602);
    expect(result.densidade_kg_m2).toBe(1.4);
  });

  it('período 0 é tratado como mínimo de 1 mês', () => {
    const result = calculateRecriaLote(
      { ...baseRecria, periodo_meses: 0 },
      tank(1600),
      premissas
    );
    expect(result.periodo_meses).toBe(1);
  });

  it('usa premissas.periodo_recria como fallback quando período é inválido', () => {
    const result = calculateRecriaLote(
      { ...baseRecria, periodo_meses: Number.NaN },
      tank(1600),
      premissas
    );
    expect(result.periodo_meses).toBe(premissas.periodo_recria);
  });
});

describe('calculateEngordaLote', () => {
  const baseEngorda: EngordaLote = {
    tankId: 1,
    modulo: 'M1',
    qtd_peixes: 6000,
    peso_entrada_kg: 4200,
    peso_ganhar_kg: 0,
    racao_periodo_kg: 0,
    conversao_alimentar: 2,
    peso_final_kg_peixe: 2.5,
    peso_total_kg: 0,
    densidade_kg_m2: 0,
    racao_dia_sc: 0,
    racao_mes_sc: 0,
    racao_total_sc: 0,
    periodo_meses: 5,
  };

  it('usa conversão alimentar do lote e peso final por peixe', () => {
    const result = calculateEngordaLote(baseEngorda, tank(23000), premissas);
    // pesoTotal = 6000 * 2.5 = 15000; ganho = 15000 - 4200 = 10800; ração = 10800 * 2 = 21600
    expect(result.peso_total_kg).toBe(15000);
    expect(result.peso_ganhar_kg).toBe(10800);
    expect(result.racao_periodo_kg).toBe(21600);
    // total = 21600/25 = 864; mês = 172.8; dia = 6.912
    expect(result.racao_total_sc).toBe(864);
    expect(result.racao_mes_sc).toBe(172.8);
    expect(result.racao_dia_sc).toBe(6.912);
  });

  it('cai para premissas quando peso final/conversão estão ausentes', () => {
    const result = calculateEngordaLote(
      { ...baseEngorda, peso_final_kg_peixe: Number.NaN, conversao_alimentar: Number.NaN },
      tank(23000),
      premissas
    );
    expect(result.peso_final_kg_peixe).toBe(premissas.peso_final_engorda);
    expect(result.conversao_alimentar).toBe(premissas.conversao_alimentar);
  });
});
