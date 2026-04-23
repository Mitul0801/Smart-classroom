import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const filterDate = url.searchParams.get('date');

        let records: any[] = [];
        const attendanceRef = adminDb.collection('attendance');

        if (session.role === 'TEACHER') {
            let query: any = attendanceRef;
            if (filterDate) {
                const startOfDay = new Date(filterDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filterDate);
                endOfDay.setHours(23, 59, 59, 999);
                
                query = query
                    .where('date', '>=', startOfDay)
                    .where('date', '<=', endOfDay);
            } else {
                query = query.limit(100);
            }
            
            const snapshot = await query.get();
            records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            
            records.sort((a, b) => {
                const dateA = a.date?.toDate?.() || new Date(0);
                const dateB = b.date?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
        } else {
            const snapshot = await attendanceRef
                .where('studentId', '==', session.userId)
                .get();
            records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            
            records.sort((a, b) => {
                const dateA = a.date?.toDate?.() || new Date(0);
                const dateB = b.date?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
        }

        const formattedRecords = records.map(r => ({
            ...r,
            date: r.date?.toDate?.() || r.date,
            createdAt: r.createdAt?.toDate?.() || r.createdAt,
        }));

        return NextResponse.json({ data: formattedRecords }, { status: 200 });
    } catch (error) {
        console.error('Attendance Fetch Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await req.json();
        const attendanceRef = adminDb.collection('attendance');
        
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await attendanceRef
            .where('studentId', '==', session.userId)
            .where('date', '>=', startOfDay)
            .where('date', '<=', endOfDay)
            .get();

        if (!existing.empty) {
            return NextResponse.json({ error: 'Attendance already marked today' }, { status: 400 });
        }

        const userDoc = await adminDb.collection('users').doc(session.userId).get();
        const studentData = userDoc.exists ? userDoc.data() : { name: 'Unknown Student', email: '' };

        const record = await attendanceRef.add({
            studentId: session.userId,
            studentStatus: status === 'PRESENT' ? 'PRESENT' : 'ABSENT',
            status: status === 'PRESENT' ? 'PRESENT' : 'ABSENT',
            date: new Date(),
            createdAt: new Date(),
            student: {
                name: studentData?.name || 'Unknown Student',
                email: studentData?.email || ''
            }
        });

        return NextResponse.json({ success: true, id: record.id }, { status: 201 });
    } catch (error) {
        console.error('Attendance Save Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
