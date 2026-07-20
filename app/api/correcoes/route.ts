import { NextResponse } from 'next/server';
import { appendCorrecao, listCorrecoes } from '@/lib/correcoesHistory.server';
import { normalizeCorrecaoInput } from '@/lib/correcoesHistory';

export const dynamic = 'force-dynamic';

// Limite defensivo do corpo da requisição (16 KB — um registro é pequeno).
const MAX_BODY_BYTES = 16_000;

export async function GET() {
  try {
    const correcoes = await listCorrecoes();
    return NextResponse.json({ correcoes });
  } catch (error) {
    console.error('Erro ao carregar histórico de correções:', error);
    return NextResponse.json(
      { error: 'Failed to load correction history' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const input = normalizeCorrecaoInput(payload);
  if (!input) {
    return NextResponse.json({ error: 'Invalid correction record' }, { status: 400 });
  }

  try {
    const correcao = await appendCorrecao(input);
    return NextResponse.json({ correcao }, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar correção:', error);
    return NextResponse.json(
      { error: 'Failed to save correction' },
      { status: 500 }
    );
  }
}
