import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { querySearchData } from '@/lib/firebase/admin-services';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await querySearchData(session.userId);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Search error', error);
    return NextResponse.json({ error: 'Search unavailable' }, { status: 500 });
  }
}
