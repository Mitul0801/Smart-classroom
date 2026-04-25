import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStudentAttendanceHistory } from '@/lib/firebase/admin-services';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getStudentAttendanceHistory(session.userId);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Student attendance portal error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
