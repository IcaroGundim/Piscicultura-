import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Lancamento } from './types';
import { generateFinanceReport } from './generateFinanceReport';

// Intercepta save() (own-property por instância no jsPDF) via subclasse que
// rebind depois do super(), evitando escrita em disco e capturando o nome.
const savedFiles: string[] = [];
vi.mock('jspdf', async (importOriginal) => {
  const actual = (await importOriginal()) as { default: new (...a: unknown[]) => unknown };
  const Real = actual.default as new (...a: unknown[]) => Record<string, unknown>;
  class Patched extends Real {
    constructor(...args: unknown[]) {
      super(...args);
      this.save = (name: string) => {
        savedFiles.push(name);
        return this;
      };
    }
  }
  return { ...actual, default: Patched };
});

const dados: Lancamento[] = [
  { id: '1', ano: 2025, mes: 3, tipo: 'custo', categoria: 'racao', quantidade: 10, precoUnitario: 120 },
  { id: '2', ano: 2025, mes: 5, tipo: 'custo', categoria: 'cal', quantidade: 50, precoUnitario: 8, descricao: 'Diesel gerador' },
  { id: '3', ano: 2026, mes: 1, tipo: 'custo', categoria: 'mao_obra', quantidade: 160, precoUnitario: 12 },
  { id: '4', ano: 2026, mes: 2, tipo: 'receita', categoria: 'venda_peixe', quantidade: 800, precoUnitario: 14 },
];

beforeEach(() => {
  savedFiles.length = 0;
});

describe('generateFinanceReport (smoke)', () => {
  it('gera PDF de custos com vários anos sem lançar', () => {
    expect(() =>
      generateFinanceReport({ lancamentos: dados, tipo: 'custo', locationName: 'Rondônia' })
    ).not.toThrow();
    expect(savedFiles.at(-1)).toMatch(/^relatorio_custos_rondonia_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('gera PDF de receitas sem lançar', () => {
    expect(() =>
      generateFinanceReport({ lancamentos: dados, tipo: 'receita', locationName: 'Acre' })
    ).not.toThrow();
    expect(savedFiles.at(-1)).toMatch(/^relatorio_receitas_acre_/);
  });

  it('não quebra quando não há dados do tipo', () => {
    expect(() => generateFinanceReport({ lancamentos: [], tipo: 'custo' })).not.toThrow();
    expect(savedFiles.at(-1)).toMatch(/^relatorio_custos_/);
  });
});
