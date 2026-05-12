import { NextResponse } from 'next/server';
import {
  getProjectState,
  saveProjectState,
} from '@/lib/projectState.server';
import {
  normalizeProjectState,
  type ProjectStateSnapshot,
} from '@/lib/projectState';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await getProjectState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  let payload: Partial<ProjectStateSnapshot>;

  try {
    payload = (await request.json()) as Partial<ProjectStateSnapshot>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid project state payload' },
      { status: 400 }
    );
  }

  const normalized = normalizeProjectState(payload);
  const savedState = await saveProjectState(normalized);
  return NextResponse.json(savedState);
}

export async function PUT(request: Request) {
  return POST(request);
}
