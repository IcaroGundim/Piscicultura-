import { describe, it, expect } from 'vitest';
import {
  saldoDoTanque,
  movimentacoesDoTanque,
  extratoComSaldo,
  movimentacaoDelta,
  seedMovimentacoesFromLotes,
} from './movimentacoes';
import type { BercarioLote, EngordaLote, Movimentacao, RecriaLote } from './types';

function mov(partial: Partial<Movimentacao>): Movimentacao {
  return {
    id: Math.random().toString(36).slice(2),
    tankId: 1,
    tipo: 'ajuste',
    direcao: 'entrada',
    quantidade: 0,
    ano: 2026,
    mes: 1,
    ...partial,
  };
}

describe('movimentacaoDelta', () => {
  it('soma entradas e subtrai saídas', () => {
    expect(movimentacaoDelta({ direcao: 'entrada', quantidade: 100 })).toBe(100);
    expect(movimentacaoDelta({ direcao: 'saida', quantidade: 40 })).toBe(-40);
  });

  it('ignora quantidades negativas/inválidas', () => {
    expect(movimentacaoDelta({ direcao: 'entrada', quantidade: -5 })).toBe(0);
    expect(movimentacaoDelta({ direcao: 'saida', quantidade: NaN })).toBe(-0);
  });
});

describe('saldoDoTanque', () => {
  it('saldo = Σ entradas − Σ saídas do tanque', () => {
    const movs = [
      mov({ tankId: 1, direcao: 'entrada', quantidade: 1000 }),
      mov({ tankId: 1, direcao: 'saida', quantidade: 300 }),
      mov({ tankId: 2, direcao: 'entrada', quantidade: 500 }), // outro tanque
      mov({ tankId: 1, direcao: 'saida', quantidade: 200 }),
    ];
    expect(saldoDoTanque(1, movs)).toBe(500);
    expect(saldoDoTanque(2, movs)).toBe(500);
    expect(saldoDoTanque(99, movs)).toBe(0);
  });

  it('nunca retorna saldo negativo', () => {
    const movs = [
      mov({ tankId: 1, direcao: 'entrada', quantidade: 100 }),
      mov({ tankId: 1, direcao: 'saida', quantidade: 250 }),
    ];
    expect(saldoDoTanque(1, movs)).toBe(0);
  });
});

describe('movimentacoesDoTanque / extratoComSaldo', () => {
  it('filtra por tanque e ordena por ano/mês', () => {
    const movs = [
      mov({ tankId: 1, mes: 3, ano: 2026, quantidade: 10 }),
      mov({ tankId: 2, mes: 1, ano: 2026, quantidade: 99 }),
      mov({ tankId: 1, mes: 1, ano: 2026, quantidade: 20 }),
    ];
    const extrato = movimentacoesDoTanque(1, movs);
    expect(extrato).toHaveLength(2);
    expect(extrato[0].mes).toBe(1);
    expect(extrato[1].mes).toBe(3);
  });

  it('acumula o saldo linha a linha', () => {
    const movs = [
      mov({ tankId: 1, mes: 1, direcao: 'entrada', quantidade: 1000 }),
      mov({ tankId: 1, mes: 2, direcao: 'saida', quantidade: 400 }),
      mov({ tankId: 1, mes: 3, direcao: 'saida', quantidade: 100 }),
    ];
    const extrato = extratoComSaldo(1, movs);
    expect(extrato.map((e) => e.saldo)).toEqual([1000, 600, 500]);
  });
});

describe('seedMovimentacoesFromLotes', () => {
  it('cria um povoamento por lote com qtd_peixes > 0 e ids determinísticos', () => {
    const bercario = [{ tankId: 9, qtd_peixes: 15000 }] as BercarioLote[];
    const recria = [{ tankId: 1, qtd_peixes: 3200 }] as RecriaLote[];
    const engorda = [
      { tankId: 3, qtd_peixes: 6000 },
      { tankId: 4, qtd_peixes: 0 }, // ignorado
    ] as EngordaLote[];

    const seed = seedMovimentacoesFromLotes(
      { bercarioLotes: bercario, recriaLotes: recria, engordaLotes: engorda },
      2026,
      1
    );

    expect(seed).toHaveLength(3);
    expect(seed.every((m) => m.tipo === 'povoamento' && m.direcao === 'entrada')).toBe(true);
    // o saldo derivado deve bater com o qtd_peixes original
    expect(saldoDoTanque(9, seed)).toBe(15000);
    expect(saldoDoTanque(1, seed)).toBe(3200);
    expect(saldoDoTanque(3, seed)).toBe(6000);
    // id determinístico (estável entre execuções)
    expect(seed.find((m) => m.tankId === 9)?.id).toBe('pov-seed-bercario-9');
  });
});
