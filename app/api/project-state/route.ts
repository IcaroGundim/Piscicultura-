import { NextResponse } from 'next/server';
import {
  getProjectState,
  saveProjectState,
  ProjectStateConflictError,
} from '@/lib/projectState.server';
import {
  normalizeProjectState,
  type ProjectStateSnapshot,
} from '@/lib/projectState';

export const dynamic = 'force-dynamic';

// Limite defensivo do corpo da requisição (1 MB) contra payloads abusivos.
const MAX_BODY_BYTES = 1_000_000;

export async function GET() {
  try {
    const state = await getProjectState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Erro ao carregar estado do projeto:', error);
    return NextResponse.json(
      { error: 'Failed to load project state' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Rejeita cedo se o Content-Length declarado exceder o limite.
  const declaredLength = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: 'Invalid project state payload' },
      { status: 400 }
    );
  }

  // Verifica o tamanho real (Content-Length pode estar ausente ou mentir).
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let payload: Partial<ProjectStateSnapshot>;
  try {
    payload = JSON.parse(rawBody) as Partial<ProjectStateSnapshot>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid project state payload' },
      { status: 400 }
    );
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json(
      { error: 'Invalid project state payload' },
      { status: 400 }
    );
  }

  const expectedUpdatedAt = request.headers.get('x-expected-updated-at');

  try {
    const normalized = normalizeProjectState(payload);
    const savedState = await saveProjectState(normalized, expectedUpdatedAt);
    return NextResponse.json(savedState);
  } catch (error) {
    if (error instanceof ProjectStateConflictError) {
      return NextResponse.json(
        { error: 'Project state was modified by another client', latest: error.latest },
        { status: 409 }
      );
    }
    console.error('Erro ao salvar estado do projeto:', error);
    return NextResponse.json(
      { error: 'Failed to save project state' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
