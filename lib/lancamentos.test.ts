import { describe, it, expect } from 'vitest';
import {
  getTipo,
  isCusto,
  isReceita,
  totalLancamento,
  totalPorCategoriaCusto,
  totalPorCategoriaReceita,
  totalPorCategoriaCustoPorMes,
  receitaTotalAnual,
  totalDespesasAnuais,
  anosDisponiveis,
} from './lancamentos';
import type { Lancamento } from './types';

function l(partial: Partial<Lancamento>): Lancamento {
  return {
    id: Math.random().toString(36).slice(2),
    ano: 2026,
    mes: 1,
    categoria: 'racao',
    quantidade: 1,
    precoUnitario: 1,
    ...partial,
  };
}

describe('getTipo / isCusto / isReceita', () => {
  it('trata lançamento sem tipo como custo', () => {
    const lanc = l({ tipo: undefined });
    expect(getTipo(lanc)).toBe('custo');
    expect(isCusto(lanc)).toBe(true);
    expect(isReceita(lanc)).toBe(false);
  });

  it('reconhece receita explícita', () => {
    const lanc = l({ tipo: 'receita', categoria: 'venda_peixe' });
    expect(isReceita(lanc)).toBe(true);
    expect(isCusto(lanc)).toBe(false);
  });
});

describe('totalLancamento', () => {
  it('multiplica quantidade por preço unitário', () => {
    expect(totalLancamento(l({ quantidade: 10, precoUnitario: 5 }))).toBe(50);
  });
});

describe('totais por categoria', () => {
  const lancamentos: Lancamento[] = [
    l({ categoria: 'racao', quantidade: 2, precoUnitario: 100 }), // custo 200
    l({ categoria: 'racao', quantidade: 1, precoUnitario: 50 }), // custo 50
    l({ categoria: 'mao_obra', quantidade: 10, precoUnitario: 20 }), // custo 200
    l({ tipo: 'receita', categoria: 'venda_peixe', quantidade: 100, precoUnitario: 9 }), // receita 900
    l({ tipo: 'receita', categoria: 'outras_receitas', quantidade: 1, precoUnitario: 300 }), // receita 300
  ];

  it('soma apenas custos em totalPorCategoriaCusto', () => {
    const totais = totalPorCategoriaCusto(lancamentos);
    expect(totais.racao).toBe(250);
    expect(totais.mao_obra).toBe(200);
    // receitas não entram nos totais de custo
    expect(Object.values(totais).reduce((a, b) => a + b, 0)).toBe(450);
  });

  it('soma apenas receitas em totalPorCategoriaReceita', () => {
    const totais = totalPorCategoriaReceita(lancamentos);
    expect(totais.venda_peixe).toBe(900);
    expect(totais.outras_receitas).toBe(300);
    expect(totais.venda_processados).toBe(0);
  });

  it('totalDespesasAnuais soma todos os custos', () => {
    expect(totalDespesasAnuais(lancamentos)).toBe(450);
  });
});

describe('receitaTotalAnual', () => {
  const lancamentos: Lancamento[] = [
    l({ tipo: 'receita', categoria: 'venda_peixe', ano: 2025, quantidade: 10, precoUnitario: 10 }), // 100
    l({ tipo: 'receita', categoria: 'venda_peixe', ano: 2026, quantidade: 20, precoUnitario: 10 }), // 200
    l({ categoria: 'racao', ano: 2026, quantidade: 5, precoUnitario: 100 }), // custo, ignorado
  ];

  it('soma receitas de todos os anos quando ano não é informado', () => {
    expect(receitaTotalAnual(lancamentos)).toBe(300);
  });

  it('filtra por ano quando informado', () => {
    expect(receitaTotalAnual(lancamentos, 2026)).toBe(200);
    expect(receitaTotalAnual(lancamentos, 2025)).toBe(100);
  });
});

describe('totalPorCategoriaCustoPorMes', () => {
  it('distribui custos pelos meses (índice 0 = janeiro)', () => {
    const lancamentos: Lancamento[] = [
      l({ categoria: 'racao', ano: 2026, mes: 1, quantidade: 1, precoUnitario: 100 }),
      l({ categoria: 'racao', ano: 2026, mes: 3, quantidade: 1, precoUnitario: 200 }),
      l({ categoria: 'racao', ano: 2025, mes: 3, quantidade: 1, precoUnitario: 999 }), // outro ano
    ];
    const matriz = totalPorCategoriaCustoPorMes(lancamentos, 2026);
    expect(matriz.racao[0]).toBe(100); // janeiro
    expect(matriz.racao[2]).toBe(200); // março
    expect(matriz.racao.reduce((a, b) => a + b, 0)).toBe(300);
  });
});

describe('anosDisponiveis', () => {
  it('retorna anos únicos em ordem decrescente', () => {
    const lancamentos: Lancamento[] = [
      l({ ano: 2024 }),
      l({ ano: 2026 }),
      l({ ano: 2024 }),
      l({ ano: 2025 }),
    ];
    expect(anosDisponiveis(lancamentos)).toEqual([2026, 2025, 2024]);
  });
});
