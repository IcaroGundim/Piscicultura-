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
  resumoMensal,
  resumoAnual,
  composicaoPorCategoria,
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

describe('resumoMensal', () => {
  it('soma custo/receita por mês e calcula resultado = receita − custo', () => {
    const lancamentos = [
      l({ mes: 1, tipo: 'custo', categoria: 'racao', quantidade: 10, precoUnitario: 100 }), // 1000
      l({ mes: 1, tipo: 'receita', categoria: 'venda_peixe', quantidade: 100, precoUnitario: 30 }), // 3000
      l({ mes: 3, tipo: 'custo', categoria: 'mao_obra', quantidade: 1, precoUnitario: 500 }), // 500
    ];
    const serie = resumoMensal(lancamentos, 2026);
    expect(serie).toHaveLength(12);
    expect(serie[0]).toMatchObject({ label: 'Jan', custo: 1000, receita: 3000, resultado: 2000 });
    expect(serie[2]).toMatchObject({ label: 'Mar', custo: 500, receita: 0, resultado: -500 });
    expect(serie[1]).toMatchObject({ custo: 0, receita: 0, resultado: 0 });
  });

  it('ignora lançamentos de outros anos', () => {
    const lancamentos = [
      l({ ano: 2025, mes: 1, quantidade: 5, precoUnitario: 100 }),
      l({ ano: 2026, mes: 1, quantidade: 2, precoUnitario: 100 }),
    ];
    expect(resumoMensal(lancamentos, 2026)[0].custo).toBe(200);
  });
});

describe('resumoAnual', () => {
  it('agrega por ano, ordenado do mais antigo ao mais recente', () => {
    const lancamentos = [
      l({
        ano: 2026,
        tipo: 'receita',
        categoria: 'venda_peixe',
        quantidade: 100,
        precoUnitario: 10,
      }), // 1000
      l({ ano: 2024, tipo: 'custo', categoria: 'racao', quantidade: 1, precoUnitario: 300 }), // 300
      l({ ano: 2026, tipo: 'custo', categoria: 'racao', quantidade: 1, precoUnitario: 400 }), // 400
    ];
    const serie = resumoAnual(lancamentos);
    expect(serie.map((p) => p.ano)).toEqual([2024, 2026]);
    expect(serie[0]).toMatchObject({ ano: 2024, custo: 300, receita: 0, resultado: -300 });
    expect(serie[1]).toMatchObject({ ano: 2026, custo: 400, receita: 1000, resultado: 600 });
  });
});

describe('composicaoPorCategoria', () => {
  it('soma por categoria, descarta zeradas e ordena maior → menor', () => {
    const lancamentos = [
      l({ tipo: 'custo', categoria: 'racao', quantidade: 1, precoUnitario: 100 }),
      l({ tipo: 'custo', categoria: 'mao_obra', quantidade: 1, precoUnitario: 500 }),
      l({ tipo: 'receita', categoria: 'venda_peixe', quantidade: 1, precoUnitario: 9999 }),
    ];
    const custos = composicaoPorCategoria(lancamentos, 'custo');
    expect(custos.map((f) => f.categoria)).toEqual(['mao_obra', 'racao']);
    expect(custos[0]).toMatchObject({ valor: 500, label: 'Mão de obra' });
    expect(custos.every((f) => f.valor > 0)).toBe(true);
    expect(custos.some((f) => f.categoria === 'venda_peixe')).toBe(false);
  });

  it('filtra por ano quando informado', () => {
    const lancamentos = [
      l({ ano: 2025, categoria: 'racao', quantidade: 1, precoUnitario: 100 }),
      l({ ano: 2026, categoria: 'racao', quantidade: 1, precoUnitario: 700 }),
    ];
    const custos2026 = composicaoPorCategoria(lancamentos, 'custo', 2026);
    expect(custos2026).toHaveLength(1);
    expect(custos2026[0].valor).toBe(700);
  });
});
