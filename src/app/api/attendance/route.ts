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
        } else {
            const snapshot = await attendanceRef
                .where('studentId', '==', session.userId)
                .get();
            records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        }

        records.sort((a, b) => {
            const dateA = a.date?.toDate?.() || new Date(a.date || 0);
            const dateB = b.date?.toDate?.() || new Date(b.date || 0);
            return dateB.getTime() - dateA.getTime();
        });

        const formattedRecords = records.map(r => ({
            ...r,
            date: r.date?.toDate?.() || r.date,
            createdAt: r.createdAt?.toDate?.() || r.createdAt,
        }));

        return NextResponse.json({ data: formattedRecords }, { status: 200 });
    } catch (error) {
        console.error('Attendance Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        console.log('--- Attendance POST Started (Optimized) ---');
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await req.json();
        const attendanceRef = adminDb.collection('attendance');
        
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Fetch all attendance for this student to avoid composite index
        // Since a student won't have thousands of records, filtering in memory is safe and faster than creating indexes
        const snapshot = await attendanceRef
            .where('studentId', '==', session.userId)
            .get();

        const alreadyMarked = snapshot.docs.some(doc => {
            const date = doc.data().date?.toDate?.() || new Date(doc.data().date);
            return date.toISOString().split('T')[0] === todayStr;
        });

        if (alreadyMarked) {
            console.warn('Attendance: Already marked for today (in-memory check)');
            return NextResponse.json({ error: 'Attendance already marked today' }, { status: 400 });
        }

        const userDoc = await adminDb.collection('users').doc(session.userId).get();
        const studentData = userDoc.exists ? userDoc.data() : { name: 'Unknown Student', email: '' };

        const record = await attendanceRef.add({
            studentId: session.userId,
            status: status === 'PRESENT' ? 'PRESENT' : 'ABSENT',
            date: new Date(),
            createdAt: new Date(),
            student: {
                name: studentData?.name || 'Unknown Student',
                email: studentData?.email || ''
            }
        });

        console.log('✅ Attendance saved with ID:', record.id);
        return NextResponse.json({ success: true, id: record.id }, { status: 201 });
    } catch (error) {
        console.error('❌ Attendance Save Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
