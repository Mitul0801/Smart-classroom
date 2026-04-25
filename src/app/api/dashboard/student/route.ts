import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStudentDashboard } from '@/lib/firebase/admin-services';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getStudentDashboard(session.userId);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Student dashboard error', error);
    return NextResponse.json({ error: 'Could not load dashboard' }, { status: 500 });
  }
}
