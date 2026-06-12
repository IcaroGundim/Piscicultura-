import { neon } from '@neondatabase/serverless';
import {
  createDefaultProjectState,
  normalizeProjectState,
  type ProjectStateSnapshot,
} from './projectState';

const STATE_ID = 'primary';
type SqlClient = any;

export type ProjectStateResponse = ProjectStateSnapshot & { updatedAt: string | null };

/**
 * Lançado quando a gravação falha na trava otimista: o estado no banco foi
 * alterado por outro cliente desde o último carregamento. Carrega o estado
 * mais recente do servidor para que o cliente possa reconciliar.
 */
export class ProjectStateConflictError extends Error {
  readonly latest: ProjectStateResponse;
  constructor(latest: ProjectStateResponse) {
    super('Project state was modified by another client');
    this.name = 'ProjectStateConflictError';
    this.latest = latest;
  }
}

let schemaReady: Promise<void> | null = null;

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }

  return neon(databaseUrl);
}

async function ensureSchema(sql: SqlClient) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS project_state (
          id text PRIMARY KEY,
          state jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
    })();
  }

  await schemaReady;
}

function toIso(updatedAt: unknown): string | null {
  if (!updatedAt) return null;
  if (updatedAt instanceof Date) return updatedAt.toISOString();
  if (typeof updatedAt === 'string') {
    const d = new Date(updatedAt);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

export async function getProjectState(): Promise<ProjectStateResponse> {
  const sql = getSqlClient();
  if (!sql) {
    return { ...createDefaultProjectState(), updatedAt: null };
  }

  await ensureSchema(sql);
  const rows = await sql`
    SELECT state, date_trunc('milliseconds', updated_at) AS updated_at
    FROM project_state
    WHERE id = ${STATE_ID}
    LIMIT 1
  `;

  if (rows.length === 0) {
    const defaultState = createDefaultProjectState();
    const inserted = await sql`
      INSERT INTO project_state (id, state, updated_at)
      VALUES (${STATE_ID}, ${JSON.stringify(defaultState)}::jsonb, date_trunc('milliseconds', now()))
      ON CONFLICT (id) DO NOTHING
      RETURNING date_trunc('milliseconds', updated_at) AS updated_at
    `;
    return { ...defaultState, updatedAt: toIso(inserted[0]?.updated_at) };
  }

  return {
    ...normalizeProjectState(rows[0]?.state as Partial<ProjectStateSnapshot> | null),
    updatedAt: toIso(rows[0]?.updated_at),
  };
}

export async function saveProjectState(
  snapshot: ProjectStateSnapshot,
  expectedUpdatedAt: string | null = null
): Promise<ProjectStateResponse> {
  const sql = getSqlClient();
  const normalized = normalizeProjectState(snapshot);

  if (!sql) {
    return { ...normalized, updatedAt: new Date().toISOString() };
  }

  await ensureSchema(sql);
  const stateJson = JSON.stringify(normalized);

  // Sem baseline conhecido (primeiro save de um cliente legado): upsert simples.
  if (!expectedUpdatedAt) {
    const rows = await sql`
      INSERT INTO project_state (id, state, updated_at)
      VALUES (${STATE_ID}, ${stateJson}::jsonb, date_trunc('milliseconds', now()))
      ON CONFLICT (id)
      DO UPDATE SET
        state = EXCLUDED.state,
        updated_at = date_trunc('milliseconds', now())
      RETURNING date_trunc('milliseconds', updated_at) AS updated_at
    `;
    return { ...normalized, updatedAt: toIso(rows[0]?.updated_at) };
  }

  // Trava otimista: só grava se o updated_at atual bater com o esperado.
  const updated = await sql`
    UPDATE project_state
    SET state = ${stateJson}::jsonb, updated_at = date_trunc('milliseconds', now())
    WHERE id = ${STATE_ID}
      AND date_trunc('milliseconds', updated_at) = ${expectedUpdatedAt}::timestamptz
    RETURNING date_trunc('milliseconds', updated_at) AS updated_at
  `;
  if (updated.length === 1) {
    return { ...normalized, updatedAt: toIso(updated[0]?.updated_at) };
  }

  // Nada atualizado: linha inexistente (primeira escrita) ou conflito.
  const existing = await sql`
    SELECT state, date_trunc('milliseconds', updated_at) AS updated_at
    FROM project_state
    WHERE id = ${STATE_ID}
    LIMIT 1
  `;

  if (existing.length === 0) {
    const inserted = await sql`
      INSERT INTO project_state (id, state, updated_at)
      VALUES (${STATE_ID}, ${stateJson}::jsonb, date_trunc('milliseconds', now()))
      ON CONFLICT (id) DO NOTHING
      RETURNING date_trunc('milliseconds', updated_at) AS updated_at
    `;
    return { ...normalized, updatedAt: toIso(inserted[0]?.updated_at) };
  }

  throw new ProjectStateConflictError({
    ...normalizeProjectState(existing[0]?.state as Partial<ProjectStateSnapshot> | null),
    updatedAt: toIso(existing[0]?.updated_at),
  });
}
