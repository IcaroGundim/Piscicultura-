import { neon } from '@neondatabase/serverless';
import {
  createDefaultProjectState,
  normalizeProjectState,
  type ProjectStateSnapshot,
} from './projectState';

const STATE_ID = 'primary';
type SqlClient = any;

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

export async function getProjectState(): Promise<ProjectStateSnapshot> {
  const sql = getSqlClient();
  if (!sql) {
    return createDefaultProjectState();
  }

  await ensureSchema(sql);
  const rows = await sql`
    SELECT state
    FROM project_state
    WHERE id = ${STATE_ID}
    LIMIT 1
  `;

  if (rows.length === 0) {
    const defaultState = createDefaultProjectState();
    await sql`
      INSERT INTO project_state (id, state)
      VALUES (${STATE_ID}, ${JSON.stringify(defaultState)}::jsonb)
      ON CONFLICT (id) DO NOTHING
    `;
    return defaultState;
  }

  return normalizeProjectState(rows[0]?.state as Partial<ProjectStateSnapshot> | null);
}

export async function saveProjectState(
  snapshot: ProjectStateSnapshot
): Promise<ProjectStateSnapshot> {
  const sql = getSqlClient();
  const normalized = normalizeProjectState(snapshot);

  if (!sql) {
    return normalized;
  }

  await ensureSchema(sql);
  await sql`
    INSERT INTO project_state (id, state, updated_at)
    VALUES (${STATE_ID}, ${JSON.stringify(normalized)}::jsonb, now())
    ON CONFLICT (id)
    DO UPDATE SET
      state = EXCLUDED.state,
      updated_at = now()
  `;

  return normalized;
}
