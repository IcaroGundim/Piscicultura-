import { describe, it, expect } from 'vitest';
import {
  normalizeProjectState,
  DEFAULT_PHASE_COLORS,
} from './projectState';

describe('normalizeProjectState — defaults e saneamento', () => {
  it('retorna o estado padrão para entrada vazia', () => {
    const state = normalizeProjectState({});
    expect(state.activeLocation).toBe('rondonia');
    expect(state.locations.rondonia).toBeDefined();
    expect(state.locations.acre).toBeDefined();
    expect(state.phaseColors).toEqual(DEFAULT_PHASE_COLORS);
  });

  it('aceita apenas activeLocation válida', () => {
    expect(normalizeProjectState({ activeLocation: 'acre' }).activeLocation).toBe('acre');
    // valor inválido cai para rondonia
    expect(
      normalizeProjectState({ activeLocation: 'narnia' as never }).activeLocation
    ).toBe('rondonia');
  });

  it('saneia cores: rejeita não-hex e mantém hex válido', () => {
    const state = normalizeProjectState({
      phaseColors: {
        bercario: 'javascript:alert(1)' as never,
        recria: '#abc',
        engorda: 'red' as never,
        vazio: '#123456',
      },
    });
    expect(state.phaseColors.bercario).toBe(DEFAULT_PHASE_COLORS.bercario); // rejeitado
    expect(state.phaseColors.recria).toBe('#abc'); // hex curto válido
    expect(state.phaseColors.engorda).toBe(DEFAULT_PHASE_COLORS.engorda); // "red" rejeitado
    expect(state.phaseColors.vazio).toBe('#123456');
  });

  it('ignora campos legados de perspectiva temporal sem quebrar o load', () => {
    const state = normalizeProjectState({
      viewPeriod: 'mensal',
      referenceMonth: 5,
      referenceYear: 2030,
    } as never);
    expect(state.activeLocation).toBe('rondonia');
    expect(state.locations.rondonia).toBeDefined();
    expect(state).not.toHaveProperty('viewPeriod');
    expect(state).not.toHaveProperty('referenceMonth');
    expect(state).not.toHaveProperty('referenceYear');
  });
});

describe('normalizeProjectState — validação de tanques/lotes', () => {
  it('descarta tanque sem id e saneia campos inválidos', () => {
    const state = normalizeProjectState({
      locations: {
        rondonia: {
          tanks: [
            { id: 1, phase: 'hacked' as never, area_m2: '99' as never, area_ha: 0 },
            { phase: 'engorda', area_m2: 100, area_ha: 0.01 } as never, // sem id -> removido
          ],
        },
      } as never,
    });
    const tanks = state.locations.rondonia.tanks;
    expect(tanks).toHaveLength(1);
    expect(tanks[0].id).toBe(1);
    expect(tanks[0].phase).toBe('vazio'); // fase inválida saneada
    expect(tanks[0].area_m2).toBe(0); // string saneada para número
  });

  it('mantém os tanques padrão quando tanks não é array', () => {
    const state = normalizeProjectState({
      locations: { rondonia: { tanks: 'oops' as never } } as never,
    });
    expect(state.locations.rondonia.tanks.length).toBeGreaterThan(0);
  });
});

describe('normalizeProjectState — lançamentos (regressão item 1)', () => {
  it('preserva receita com tipo e descrição no round-trip', () => {
    const state = normalizeProjectState({
      locations: {
        rondonia: {
          custos: {
            lancamentos: [
              {
                id: 'r1',
                ano: 2026,
                mes: 3,
                tipo: 'receita',
                categoria: 'venda_peixe',
                quantidade: 10,
                precoUnitario: 5,
                descricao: 'venda teste',
              },
            ],
          },
        },
      } as never,
    });
    const [lanc] = state.locations.rondonia.custos.lancamentos;
    expect(lanc.tipo).toBe('receita');
    expect(lanc.categoria).toBe('venda_peixe');
    expect(lanc.descricao).toBe('venda teste');
    expect(lanc.quantidade).toBe(10);
  });

  it('infere tipo a partir da categoria quando ausente', () => {
    const state = normalizeProjectState({
      locations: {
        rondonia: {
          custos: {
            lancamentos: [
              { id: 'a', ano: 2026, mes: 1, categoria: 'racao', quantidade: 1, precoUnitario: 1 },
              { id: 'b', ano: 2026, mes: 1, categoria: 'venda_peixe', quantidade: 1, precoUnitario: 1 },
            ],
          },
        },
      } as never,
    });
    const lancs = state.locations.rondonia.custos.lancamentos;
    expect(lancs.find((x) => x.id === 'a')?.tipo).toBe('custo');
    expect(lancs.find((x) => x.id === 'b')?.tipo).toBe('receita');
  });

  it('descarta lançamentos com categoria/mês inválidos', () => {
    const state = normalizeProjectState({
      locations: {
        rondonia: {
          custos: {
            lancamentos: [
              { id: 'ok', ano: 2026, mes: 3, categoria: 'racao', quantidade: 1, precoUnitario: 1 },
              { id: 'bad-cat', ano: 2026, mes: 3, categoria: 'invalida' as never, quantidade: 1, precoUnitario: 1 },
              { id: 'bad-mes', ano: 2026, mes: 13, categoria: 'racao', quantidade: 1, precoUnitario: 1 },
            ],
          },
        },
      } as never,
    });
    const lancs = state.locations.rondonia.custos.lancamentos;
    expect(lancs).toHaveLength(1);
    expect(lancs[0].id).toBe('ok');
  });

  it('limita a quantidade de lançamentos (defesa contra DoS)', () => {
    const lancamentos = Array.from({ length: 10_050 }, (_, i) => ({
      id: `l${i}`,
      ano: 2026,
      mes: 1,
      categoria: 'racao' as const,
      quantidade: 1,
      precoUnitario: 1,
    }));
    const state = normalizeProjectState({
      locations: { rondonia: { custos: { lancamentos } } } as never,
    });
    expect(state.locations.rondonia.custos.lancamentos.length).toBe(10_000);
  });
});
