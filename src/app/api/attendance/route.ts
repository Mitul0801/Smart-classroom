import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listAttendance, markAttendance } from '@/lib/firebase/admin-services';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const filterDate = url.searchParams.get('date') || undefined;
        const data = await listAttendance(filterDate);
        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Attendance Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await req.json();
        await markAttendance(session.userId, status === 'ABSENT' ? 'ABSENT' : 'PRESENT');
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === 'Attendance already marked for today') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('❌ Attendance Save Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
