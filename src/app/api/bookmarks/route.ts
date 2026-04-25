import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  createSavedNoteServer,
  deleteSavedNoteServer,
  listSavedNotesServer,
} from '@/lib/firebase/admin-services';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await listSavedNotesServer(session.userId);
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { source?: string; content?: string };
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Missing content' }, { status: 400 });
  }

  await createSavedNoteServer({
    userId: session.userId,
    source: body.source || 'AI chat response',
    content: body.content,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const noteId = req.nextUrl.searchParams.get('id');
  if (!noteId) {
    return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
  }

  await deleteSavedNoteServer(session.userId, noteId);
  return NextResponse.json({ success: true });
}
