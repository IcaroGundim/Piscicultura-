import type { LocationKey, MovimentacaoDirecao } from './types';

/** Endpoint da API do histórico de correções (tabela separada no NEON). */
export const CORRECOES_ENDPOINT = '/api/correcoes';

/** Teto defensivo de itens retornados/aceitos. */
export const MAX_CORRECOES = 5000;

const VALID_LOCATIONS: LocationKey[] = ['rondonia', 'acre'];
const VALID_DIRECOES: MovimentacaoDirecao[] = ['entrada', 'saida'];

/**
 * Um registro de correção de saldo, persistido de forma independente do blob
 * de estado do projeto. É um log append-only: cada edição de saldo gera uma
 * linha, imutável, com o antes/depois capturado no momento.
 */
export interface CorrecaoSaldo {
  id: string;
  location: LocationKey;
  tankId: number;
  direcao: MovimentacaoDirecao;
  quantidade: number;
  saldoAntes: number;
  saldoDepois: number;
  ano: number;
  mes: number;
  descricao?: string;
  /** ISO 8601, definido pelo servidor no momento da inserção. */
  createdAt: string;
}

/** Dados enviados pelo cliente ao registrar uma correção (id/createdAt são do servidor). */
export type CorrecaoSaldoInput = Omit<CorrecaoSaldo, 'id' | 'createdAt'>;

/** Valida e normaliza o corpo recebido do cliente; retorna null se inválido. */
export function normalizeCorrecaoInput(raw: unknown): CorrecaoSaldoInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<CorrecaoSaldo>;

  if (!VALID_LOCATIONS.includes(r.location as LocationKey)) return null;
  if (!VALID_DIRECOES.includes(r.direcao as MovimentacaoDirecao)) return null;

  const int = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : null;

  const tankId = int(r.tankId);
  const quantidade = int(r.quantidade);
  const saldoAntes = int(r.saldoAntes);
  const saldoDepois = int(r.saldoDepois);
  const ano = int(r.ano);
  const mes = int(r.mes);

  if (tankId == null || tankId < 0) return null;
  if (quantidade == null || quantidade <= 0) return null;
  if (saldoAntes == null || saldoAntes < 0) return null;
  if (saldoDepois == null || saldoDepois < 0) return null;
  if (ano == null || ano < 1900 || ano > 3000) return null;
  if (mes == null || mes < 1 || mes > 12) return null;

  const descricao =
    typeof r.descricao === 'string' && r.descricao.trim()
      ? r.descricao.trim().slice(0, 200)
      : undefined;

  return {
    location: r.location as LocationKey,
    tankId,
    direcao: r.direcao as MovimentacaoDirecao,
    quantidade,
    saldoAntes,
    saldoDepois,
    ano,
    mes,
    ...(descricao ? { descricao } : {}),
  };
}
