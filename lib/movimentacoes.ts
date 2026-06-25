import type {
  BercarioLote,
  EngordaLote,
  Movimentacao,
  RecriaLote,
  TankPhase,
} from './types';

/**
 * Gera um id único para uma movimentação, reusando o mesmo padrão de
 * `generateLancamentoId` em `lib/store.ts`.
 */
export function generateMovimentacaoId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `mov_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** Soma com sinal de uma movimentação: entrada soma, saída subtrai. */
export function movimentacaoDelta(mov: Pick<Movimentacao, 'direcao' | 'quantidade'>): number {
  const qtd = Number.isFinite(mov.quantidade) ? Math.max(0, mov.quantidade) : 0;
  return mov.direcao === 'saida' ? -qtd : qtd;
}

/**
 * Saldo de peixes de um tanque = Σ entradas − Σ saídas das movimentações
 * cujo `tankId` é o tanque informado.
 */
export function saldoDoTanque(tankId: number, movimentacoes: Movimentacao[]): number {
  let saldo = 0;
  for (const mov of movimentacoes) {
    if (mov.tankId !== tankId) continue;
    saldo += movimentacaoDelta(mov);
  }
  return Math.max(0, Math.round(saldo));
}

/**
 * Extrato de um tanque: movimentações que o afetam, ordenadas por data
 * (ano/mês) crescente e mantendo a ordem de inserção como desempate.
 */
export function movimentacoesDoTanque(
  tankId: number,
  movimentacoes: Movimentacao[]
): Movimentacao[] {
  return movimentacoes
    .map((mov, index) => ({ mov, index }))
    .filter(({ mov }) => mov.tankId === tankId)
    .sort((a, b) => {
      if (a.mov.ano !== b.mov.ano) return a.mov.ano - b.mov.ano;
      if (a.mov.mes !== b.mov.mes) return a.mov.mes - b.mov.mes;
      return a.index - b.index;
    })
    .map(({ mov }) => mov);
}

/**
 * Extrato com saldo acumulado linha a linha — útil para a UI exibir
 * "saldo após cada movimentação".
 */
export function extratoComSaldo(
  tankId: number,
  movimentacoes: Movimentacao[]
): Array<{ mov: Movimentacao; saldo: number }> {
  let saldo = 0;
  return movimentacoesDoTanque(tankId, movimentacoes).map((mov) => {
    saldo += movimentacaoDelta(mov);
    return { mov, saldo: Math.max(0, Math.round(saldo)) };
  });
}

interface LotesPorFase {
  bercarioLotes: BercarioLote[];
  recriaLotes: RecriaLote[];
  engordaLotes: EngordaLote[];
}

/**
 * Migração / seed: cria uma movimentação de `povoamento` por lote existente,
 * para que o saldo derivado reconcilie com o `qtd_peixes` já cadastrado.
 * Usa id determinístico (`pov-seed-<fase>-<tankId>`) para não quebrar a
 * comparação de "estado padrão" no store.
 */
export function seedMovimentacoesFromLotes(
  lotes: LotesPorFase,
  ano = new Date().getFullYear(),
  mes = 1
): Movimentacao[] {
  const movimentacoes: Movimentacao[] = [];

  const seed = (
    tankId: number,
    qtd: number,
    faseTanque: TankPhase
  ) => {
    const quantidade = Math.max(0, Math.round(Number.isFinite(qtd) ? qtd : 0));
    if (quantidade <= 0) return;
    movimentacoes.push({
      id: `pov-seed-${faseTanque}-${tankId}`,
      tankId,
      tipo: 'povoamento',
      direcao: 'entrada',
      quantidade,
      ano,
      mes,
      faseTanque,
      descricao: 'Saldo inicial',
    });
  };

  for (const lote of lotes.bercarioLotes) seed(lote.tankId, lote.qtd_peixes, 'bercario');
  for (const lote of lotes.recriaLotes) seed(lote.tankId, lote.qtd_peixes, 'recria');
  for (const lote of lotes.engordaLotes) seed(lote.tankId, lote.qtd_peixes, 'engorda');

  return movimentacoes;
}
