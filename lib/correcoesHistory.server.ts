import { neon } from '@neondatabase/serverless';
import {
  MAX_CORRECOES,
  type CorrecaoSaldo,
  type CorrecaoSaldoInput,
} from './correcoesHistory';
import type { LocationKey, MovimentacaoDirecao } from './types';

type SqlClient = any;

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  return neon(databaseUrl);
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema(sql: SqlClient) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS correcao_saldo (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          location text NOT NULL,
          tank_id integer NOT NULL,
          direcao text NOT NULL,
          quantidade integer NOT NULL,
          saldo_antes integer NOT NULL,
          saldo_depois integer NOT NULL,
          ano integer NOT NULL,
          mes integer NOT NULL,
          descricao text,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS correcao_saldo_created_idx
        ON correcao_saldo (created_at DESC)
      `;
    })();
  }
  await schemaReady;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
}

function mapRow(row: Record<string, unknown>): CorrecaoSaldo {
  return {
    id: String(row.id),
    location: row.location as LocationKey,
    tankId: Number(row.tank_id),
    direcao: row.direcao as MovimentacaoDirecao,
    quantidade: Number(row.quantidade),
    saldoAntes: Number(row.saldo_antes),
    saldoDepois: Number(row.saldo_depois),
    ano: Number(row.ano),
    mes: Number(row.mes),
    ...(row.descricao ? { descricao: String(row.descricao) } : {}),
    createdAt: toIso(row.created_at),
  };
}

/** Lista as correções mais recentes primeiro. Sem banco configurado, retorna []. */
export async function listCorrecoes(limit = MAX_CORRECOES): Promise<CorrecaoSaldo[]> {
  const sql = getSqlClient();
  if (!sql) return [];

  await ensureSchema(sql);
  const capped = Math.min(Math.max(1, Math.floor(limit)), MAX_CORRECOES);
  const rows = await sql`
    SELECT id, location, tank_id, direcao, quantidade, saldo_antes, saldo_depois,
           ano, mes, descricao, created_at
    FROM correcao_saldo
    ORDER BY created_at DESC
    LIMIT ${capped}
  `;
  return (rows as Record<string, unknown>[]).map(mapRow);
}

/** Insere uma correção (append-only). Sem banco, ecoa o registro sem persistir. */
export async function appendCorrecao(input: CorrecaoSaldoInput): Promise<CorrecaoSaldo> {
  const sql = getSqlClient();
  const descricao = input.descricao ?? null;

  if (!sql) {
    return {
      ...input,
      id: `local_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
  }

  await ensureSchema(sql);
  const rows = await sql`
    INSERT INTO correcao_saldo
      (location, tank_id, direcao, quantidade, saldo_antes, saldo_depois, ano, mes, descricao)
    VALUES
      (${input.location}, ${input.tankId}, ${input.direcao}, ${input.quantidade},
       ${input.saldoAntes}, ${input.saldoDepois}, ${input.ano}, ${input.mes}, ${descricao})
    RETURNING id, location, tank_id, direcao, quantidade, saldo_antes, saldo_depois,
              ano, mes, descricao, created_at
  `;
  return mapRow(rows[0] as Record<string, unknown>);
}
