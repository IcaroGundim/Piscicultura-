export type TankPhase = 'bercario' | 'recria' | 'engorda' | 'vazio';

export interface Tank {
  id: number;
  area_m2: number;
  area_ha: number;
  phase: TankPhase;
  subfase?: string;
}

export interface BercarioLote {
  tankId: number;
  nome: string;
  qtd_peixes: number;
  peso_entrada_kg: number;
  peso_ganhar_kg: number;
  racao_periodo_kg: number;
  peso_total_kg: number;
  /**
   * Densidade em kg/m³. Apesar do sufixo `_m2`, o valor assume uma coluna
   * d'água de 1 m (volume ≈ área), logo equivale a kg/m³ — que é como a UI
   * exibe. Ver `densityKgM3` em `lib/feedingCalculations.ts`.
   */
  densidade_kg_m2: number;
  peso_transferencia_kg: number;
  racao_dia_sc: number;
  racao_mes_sc: number;
  racao_total_sc: number;
}

export interface RecriaLote {
  tankId: number;
  qtd_peixes: number;
  peso_entrada_kg: number;
  peso_ganhar_kg: number;
  racao_periodo_kg: number;
  peso_total_kg: number;
  /**
   * Densidade em kg/m³. Apesar do sufixo `_m2`, o valor assume uma coluna
   * d'água de 1 m (volume ≈ área), logo equivale a kg/m³ — que é como a UI
   * exibe. Ver `densityKgM3` em `lib/feedingCalculations.ts`.
   */
  densidade_kg_m2: number;
  peso_transferencia_kg: number;
  racao_dia_sc: number;
  racao_mes_sc: number;
  racao_total_sc: number;
  periodo_meses: number;
}

export interface EngordaLote {
  tankId: number;
  modulo: string;
  qtd_peixes: number;
  peso_entrada_kg: number;
  peso_ganhar_kg: number;
  racao_periodo_kg: number;
  conversao_alimentar: number;
  peso_final_kg_peixe: number;
  peso_total_kg: number;
  /**
   * Densidade em kg/m³. Apesar do sufixo `_m2`, o valor assume uma coluna
   * d'água de 1 m (volume ≈ área), logo equivale a kg/m³ — que é como a UI
   * exibe. Ver `densityKgM3` em `lib/feedingCalculations.ts`.
   */
  densidade_kg_m2: number;
  racao_dia_sc: number;
  racao_mes_sc: number;
  racao_total_sc: number;
  periodo_meses: number;
}

export interface Premissas {
  producao_anual: number;
  conversao_alimentar: number;
  ciclos_ano: number;
  preco_venda: number;
  peso_final_engorda: number;
  peso_transfer_recria: number;
  peso_transfer_bercario: number;
  periodo_engorda: number;
  periodo_recria: number;
}

export type TipoLancamento = 'custo' | 'receita';

export type CategoriaCusto =
  | 'racao'
  | 'ferramentas'
  | 'sal_grosso'
  | 'cal'
  | 'mao_obra'
  | 'outras';

export type CategoriaReceita =
  | 'venda_peixe'
  | 'venda_processados'
  | 'outras_receitas';

export type CategoriaLancamento = CategoriaCusto | CategoriaReceita;

export interface Lancamento {
  id: string;
  ano: number;
  mes: number;
  tipo?: TipoLancamento;
  categoria: CategoriaLancamento;
  quantidade: number;
  precoUnitario: number;
  descricao?: string;
}

export interface Custos {
  lancamentos: Lancamento[];
}

export type MovimentacaoTipo = 'povoamento' | 'venda' | 'transferencia' | 'ajuste';

export type MovimentacaoDirecao = 'entrada' | 'saida';

export interface Movimentacao {
  id: string;
  tankId: number; // tanque afetado por ESTA linha
  tipo: MovimentacaoTipo;
  direcao: MovimentacaoDirecao;
  quantidade: number; // sempre positivo; o sinal vem de `direcao`
  ano: number;
  mes: number; // 1–12 (alinhado com Lancamento)
  faseTanque?: TankPhase; // fase do tanque no momento (contexto)
  tankDestino?: number; // p/ transferência entre tanques
  faseDestino?: TankPhase; // fase de destino na transferência
  lancamentoId?: string; // vínculo com a venda financeira (Lancamento.id)
  descricao?: string;
}

export const MOVIMENTACAO_TIPO_LABELS: Record<MovimentacaoTipo, string> = {
  povoamento: 'Povoamento',
  venda: 'Venda',
  transferencia: 'Transferência de fase',
  ajuste: 'Ajuste manual',
};

export const CATEGORIA_CUSTO_LABELS: Record<CategoriaCusto, string> = {
  racao: 'Ração',
  ferramentas: 'Ferramentas e Maquinário',
  sal_grosso: 'Sal grosso',
  cal: 'Cal',
  mao_obra: 'Mão de obra',
  outras: 'Outros',
};

export const CATEGORIA_CUSTO_COLORS: Record<CategoriaCusto, string> = {
  racao: '#2563eb',
  ferramentas: '#a16207',
  sal_grosso: '#0891b2',
  cal: '#94ba65',
  mao_obra: '#f59e0b',
  outras: '#52525b',
};

export const CATEGORIA_RECEITA_LABELS: Record<CategoriaReceita, string> = {
  venda_peixe: 'Venda de peixe',
  venda_processados: 'Venda de processados',
  outras_receitas: 'Outras receitas',
};

export const CATEGORIA_RECEITA_COLORS: Record<CategoriaReceita, string> = {
  venda_peixe: '#10b981',
  venda_processados: '#0ea5e9',
  outras_receitas: '#a855f7',
};

export const CATEGORIA_LANCAMENTO_LABELS: Record<CategoriaLancamento, string> = {
  ...CATEGORIA_CUSTO_LABELS,
  ...CATEGORIA_RECEITA_LABELS,
};

export const CATEGORIA_LANCAMENTO_COLORS: Record<CategoriaLancamento, string> = {
  ...CATEGORIA_CUSTO_COLORS,
  ...CATEGORIA_RECEITA_COLORS,
};

export const PHASE_LABELS: Record<TankPhase, string> = {
  bercario: 'Berçário',
  recria: 'Recria',
  engorda: 'Engorda',
  vazio: 'Vazio',
};

export const PHASE_COLORS: Record<TankPhase, string> = {
  bercario: '#94ba65',
  recria: '#cd5c5c',
  engorda: '#2563eb',
  vazio: '#52525b',
};

export type LocationKey = 'rondonia' | 'acre';

export interface LocationData {
  tanks: Tank[];
  bercarioLotes: BercarioLote[];
  recriaLotes: RecriaLote[];
  engordaLotes: EngordaLote[];
  premissas: Premissas;
  custos: Custos;
  movimentacoes: Movimentacao[];
}

export const LOCATION_LABELS: Record<LocationKey, string> = {
  rondonia: 'Rondônia',
  acre: 'Acre',
};
