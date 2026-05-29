import type {
  CategoriaCusto,
  CategoriaReceita,
  Lancamento,
  TipoLancamento,
} from './types';

export const CATEGORIAS_CUSTO: CategoriaCusto[] = [
  'racao',
  'ferramentas',
  'sal_grosso',
  'cal',
  'mao_obra',
  'outras',
];

export const CATEGORIAS_RECEITA: CategoriaReceita[] = [
  'venda_peixe',
  'venda_processados',
  'outras_receitas',
];

// Alias mantido para retro-compatibilidade — mesma referência que CATEGORIAS_CUSTO.
export const CATEGORIAS_LANCAMENTO: CategoriaCusto[] = CATEGORIAS_CUSTO;

export const CATEGORIA_CUSTO_UNIDADES: Record<CategoriaCusto, string> = {
  racao: 'sc',
  ferramentas: 'un',
  sal_grosso: 'kg',
  cal: 'kg',
  mao_obra: 'h',
  outras: 'un',
};

export const CATEGORIA_RECEITA_UNIDADES: Record<CategoriaReceita, string> = {
  venda_peixe: 'kg',
  venda_processados: 'kg',
  outras_receitas: 'un',
};

export const CATEGORIA_UNIDADES: Record<string, string> = {
  ...CATEGORIA_CUSTO_UNIDADES,
  ...CATEGORIA_RECEITA_UNIDADES,
};

export function getTipo(l: Lancamento): TipoLancamento {
  return l.tipo ?? 'custo';
}

export function isCusto(l: Lancamento): boolean {
  return getTipo(l) === 'custo';
}

export function isReceita(l: Lancamento): boolean {
  return getTipo(l) === 'receita';
}

export function totalLancamento(l: Lancamento): number {
  return (l.quantidade ?? 0) * (l.precoUnitario ?? 0);
}

export function totalPorCategoriaCusto(
  lancamentos: Lancamento[],
): Record<CategoriaCusto, number> {
  const acc: Record<CategoriaCusto, number> = {
    racao: 0,
    ferramentas: 0,
    sal_grosso: 0,
    cal: 0,
    mao_obra: 0,
    outras: 0,
  };
  for (const l of lancamentos) {
    if (!isCusto(l)) continue;
    if (l.categoria in acc) {
      acc[l.categoria as CategoriaCusto] += totalLancamento(l);
    }
  }
  return acc;
}

export function totalPorCategoriaReceita(
  lancamentos: Lancamento[],
): Record<CategoriaReceita, number> {
  const acc: Record<CategoriaReceita, number> = {
    venda_peixe: 0,
    venda_processados: 0,
    outras_receitas: 0,
  };
  for (const l of lancamentos) {
    if (!isReceita(l)) continue;
    if (l.categoria in acc) {
      acc[l.categoria as CategoriaReceita] += totalLancamento(l);
    }
  }
  return acc;
}

// Alias mantido para retro-compatibilidade — agora filtra implicitamente por custos.
export function totalPorCategoria(
  lancamentos: Lancamento[],
): Record<CategoriaCusto, number> {
  return totalPorCategoriaCusto(lancamentos);
}

export function totalPorCategoriaCustoPorMes(
  lancamentos: Lancamento[],
  ano: number,
): Record<CategoriaCusto, number[]> {
  const matriz: Record<CategoriaCusto, number[]> = {
    racao: Array(12).fill(0),
    ferramentas: Array(12).fill(0),
    sal_grosso: Array(12).fill(0),
    cal: Array(12).fill(0),
    mao_obra: Array(12).fill(0),
    outras: Array(12).fill(0),
  };
  for (const l of lancamentos) {
    if (!isCusto(l)) continue;
    if (l.ano !== ano) continue;
    if (!(l.categoria in matriz)) continue;
    const idx = Math.max(0, Math.min(11, l.mes - 1));
    matriz[l.categoria as CategoriaCusto][idx] += totalLancamento(l);
  }
  return matriz;
}

// Alias retro-compatível.
export const totalPorCategoriaPorMes = totalPorCategoriaCustoPorMes;

export function custoRacaoAnual(lancamentos: Lancamento[]): number {
  return totalPorCategoriaCusto(lancamentos).racao;
}

export function custoMaoObraAnual(lancamentos: Lancamento[]): number {
  return totalPorCategoriaCusto(lancamentos).mao_obra;
}

export function outrasDespesasAnuais(lancamentos: Lancamento[]): number {
  const t = totalPorCategoriaCusto(lancamentos);
  return t.ferramentas + t.sal_grosso + t.cal + t.outras;
}

export function totalDespesasAnuais(lancamentos: Lancamento[]): number {
  return (
    custoRacaoAnual(lancamentos)
    + custoMaoObraAnual(lancamentos)
    + outrasDespesasAnuais(lancamentos)
  );
}

export function receitaTotalAnual(
  lancamentos: Lancamento[],
  ano?: number,
): number {
  let total = 0;
  for (const l of lancamentos) {
    if (!isReceita(l)) continue;
    if (ano !== undefined && l.ano !== ano) continue;
    total += totalLancamento(l);
  }
  return total;
}

export function anosDisponiveis(lancamentos: Lancamento[]): number[] {
  const anos = new Set<number>();
  for (const l of lancamentos) anos.add(l.ano);
  return Array.from(anos).sort((a, b) => b - a);
}
