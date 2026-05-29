import { neon } from '@neondatabase/serverless';
import {
  createDefaultProjectState,
  normalizeProjectState,
  type ProjectStateSnapshot,
} from './projectState';

const STATE_ID = 'primary';
type SqlClient = any;

export type ProjectStateResponse = ProjectStateSnapshot & { updatedAt: string | null };

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
    SELECT state, updated_at
    FROM project_state
    WHERE id = ${STATE_ID}
    LIMIT 1
  `;

  if (rows.length === 0) {
    const defaultState = createDefaultProjectState();
    const inserted = await sql`
      INSERT INTO project_state (id, state)
      VALUES (${STATE_ID}, ${JSON.stringify(defaultState)}::jsonb)
      ON CONFLICT (id) DO NOTHING
      RETURNING updated_at
    `;
    return { ...defaultState, updatedAt: toIso(inserted[0]?.updated_at) };
  }

  return {
    ...normalizeProjectState(rows[0]?.state as Partial<ProjectStateSnapshot> | null),
    updatedAt: toIso(rows[0]?.updated_at),
  };
}

export async function saveProjectState(
  snapshot: ProjectStateSnapshot
): Promise<ProjectStateResponse> {
  const sql = getSqlClient();
  const normalized = normalizeProjectState(snapshot);

  if (!sql) {
    return { ...normalized, updatedAt: new Date().toISOString() };
  }

  await ensureSchema(sql);
  const rows = await sql`
    INSERT INTO project_state (id, state, updated_at)
    VALUES (${STATE_ID}, ${JSON.stringify(normalized)}::jsonb, now())
    ON CONFLICT (id)
    DO UPDATE SET
      state = EXCLUDED.state,
      updated_at = now()
    RETURNING updated_at
  `;

  return { ...normalized, updatedAt: toIso(rows[0]?.updated_at) };
}
