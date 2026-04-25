import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listChatHistory } from '@/lib/firebase/admin-services';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await listChatHistory(session.userId);
  return NextResponse.json({ data });
}
