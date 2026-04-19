import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    orderBy, 
    Timestamp,
    doc,
    getDoc,
    limit
} from 'firebase/firestore';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const filterDate = url.searchParams.get('date');

        let records: any[] = [];
        const attendanceRef = collection(db, 'attendance');

        if (session.role === 'TEACHER') {
            let q;
            if (filterDate) {
                const startOfDay = new Date(filterDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filterDate);
                endOfDay.setHours(23, 59, 59, 999);
                
                q = query(
                    attendanceRef,
                    where('date', '>=', Timestamp.fromDate(startOfDay)),
                    where('date', '<=', Timestamp.fromDate(endOfDay))
                );
            } else {
                q = query(attendanceRef, limit(100));
            }
            
            const snapshot = await getDocs(q);
            records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort in memory to avoid index requirements
            records.sort((a, b) => {
                const dateA = a.date?.toDate?.() || new Date(0);
                const dateB = b.date?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            
            // In Firestore, there is no easy "include" for relationships.
            // We check if student info is already denormalized or fetch it.
            // For now, assume it's denormalized during creation for speed.
        } else {
            // Student gets their own records
            const q = query(
                attendanceRef, 
                where('studentId', '==', session.userId)
            );
            const snapshot = await getDocs(q);
            records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort in memory to avoid needing a composite index
            records.sort((a, b) => {
                const dateA = a.date?.toDate?.() || new Date(0);
                const dateB = b.date?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
        }

        // Convert Firestore Timestamps to plain dates for the frontend
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
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await req.json();
        const attendanceRef = collection(db, 'attendance');
        
        // Prevent multiple entries per day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(
            attendanceRef,
            where('studentId', '==', session.userId),
            where('date', '>=', Timestamp.fromDate(startOfDay)),
            where('date', '<=', Timestamp.fromDate(endOfDay))
        );

        const existing = await getDocs(q);
        if (!existing.empty) {
            return NextResponse.json({ error: 'Attendance already marked today' }, { status: 400 });
        }

        // Fetch student name to denormalize for teacher view
        const studentDoc = await getDoc(doc(db, 'users', session.userId));
        const studentData = studentDoc.exists() ? studentDoc.data() : { name: 'Unknown Student' };

        const record = await addDoc(attendanceRef, {
            studentId: session.userId,
            studentStatus: status === 'PRESENT' ? 'PRESENT' : 'ABSENT', // Status is a keyword in Firestore sometimes
            status: status === 'PRESENT' ? 'PRESENT' : 'ABSENT',
            date: Timestamp.now(),
            createdAt: Timestamp.now(),
            student: {
                name: studentData.name,
                email: studentData.email
            }
        });

        return NextResponse.json({ success: true, id: record.id }, { status: 201 });
    } catch (error) {
        console.error('Attendance Save Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
