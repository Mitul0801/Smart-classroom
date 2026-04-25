import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTeacherDashboard } from '@/lib/firebase/admin-services';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getTeacherDashboard(session.userId);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Teacher dashboard error', error);
    return NextResponse.json({ error: 'Could not load dashboard' }, { status: 500 });
  }
}
