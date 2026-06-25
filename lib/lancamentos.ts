import type {
  CategoriaCusto,
  CategoriaLancamento,
  CategoriaReceita,
  Lancamento,
  TipoLancamento,
} from './types';
import {
  CATEGORIA_CUSTO_COLORS,
  CATEGORIA_CUSTO_LABELS,
  CATEGORIA_RECEITA_COLORS,
  CATEGORIA_RECEITA_LABELS,
} from './types';

export const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

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

export function totalPorCategoriaCusto(lancamentos: Lancamento[]): Record<CategoriaCusto, number> {
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
  lancamentos: Lancamento[]
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
export function totalPorCategoria(lancamentos: Lancamento[]): Record<CategoriaCusto, number> {
  return totalPorCategoriaCusto(lancamentos);
}

export function totalPorCategoriaCustoPorMes(
  lancamentos: Lancamento[],
  ano: number
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
    custoRacaoAnual(lancamentos) +
    custoMaoObraAnual(lancamentos) +
    outrasDespesasAnuais(lancamentos)
  );
}

export function receitaTotalAnual(lancamentos: Lancamento[], ano?: number): number {
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

// --- Agregações para a aba "Resumo" (gráficos) ---

export interface ResumoPonto {
  label: string;
  custo: number;
  receita: number;
  resultado: number;
}

/**
 * Série dos 12 meses de um ano: custo, receita e resultado (receita − custo).
 * Índice 0 = Janeiro. Sempre devolve 12 posições (meses sem dados ficam zerados).
 */
export function resumoMensal(lancamentos: Lancamento[], ano: number): ResumoPonto[] {
  const custos = Array(12).fill(0) as number[];
  const receitas = Array(12).fill(0) as number[];
  for (const l of lancamentos) {
    if (l.ano !== ano) continue;
    const idx = Math.max(0, Math.min(11, l.mes - 1));
    if (isReceita(l)) receitas[idx] += totalLancamento(l);
    else custos[idx] += totalLancamento(l);
  }
  return MESES_CURTOS.map((label, i) => ({
    label,
    custo: custos[i],
    receita: receitas[i],
    resultado: receitas[i] - custos[i],
  }));
}

/**
 * Série anual (um ponto por ano com dados), ordenada do mais antigo para o mais
 * recente — para visualizar a tendência de longo prazo.
 */
export function resumoAnual(lancamentos: Lancamento[]): Array<ResumoPonto & { ano: number }> {
  const porAno = new Map<number, { custo: number; receita: number }>();
  for (const l of lancamentos) {
    const acc = porAno.get(l.ano) ?? { custo: 0, receita: 0 };
    if (isReceita(l)) acc.receita += totalLancamento(l);
    else acc.custo += totalLancamento(l);
    porAno.set(l.ano, acc);
  }
  return Array.from(porAno.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ano, { custo, receita }]) => ({
      ano,
      label: String(ano),
      custo,
      receita,
      resultado: receita - custo,
    }));
}

export interface FatiaCategoria {
  categoria: CategoriaLancamento;
  label: string;
  color: string;
  valor: number;
}

/**
 * Composição por categoria de um tipo (custo ou receita), opcionalmente filtrada
 * por ano. Já vem ordenada (maior → menor) e sem categorias zeradas — pronta para
 * um donut/pizza.
 */
export function composicaoPorCategoria(
  lancamentos: Lancamento[],
  tipo: TipoLancamento,
  ano?: number
): FatiaCategoria[] {
  const filtrados = ano === undefined ? lancamentos : lancamentos.filter((l) => l.ano === ano);
  const labels = tipo === 'receita' ? CATEGORIA_RECEITA_LABELS : CATEGORIA_CUSTO_LABELS;
  const colors = tipo === 'receita' ? CATEGORIA_RECEITA_COLORS : CATEGORIA_CUSTO_COLORS;
  const totais =
    tipo === 'receita' ? totalPorCategoriaReceita(filtrados) : totalPorCategoriaCusto(filtrados);

  return (Object.entries(totais) as Array<[CategoriaLancamento, number]>)
    .filter(([, valor]) => valor > 0)
    .map(([categoria, valor]) => ({
      categoria,
      label: labels[categoria as keyof typeof labels],
      color: colors[categoria as keyof typeof colors],
      valor,
    }))
    .sort((a, b) => b.valor - a.valor);
}
