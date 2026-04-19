import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const notesRef = collection(db, 'notes');
        const q = query(notesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const notes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        return NextResponse.json({ data: notes }, { status: 200 });
    } catch (error) {
        console.error('Notes Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, content, fileUrl } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Missing title' }, { status: 400 });
        }

        // Fetch teacher name to denormalize
        const teacherDoc = await getDoc(doc(db, 'users', session.userId));
        const teacherName = teacherDoc.exists() ? teacherDoc.data().name : 'Unknown Teacher';

        const noteRef = await addDoc(collection(db, 'notes'), {
            teacherId: session.userId,
            teacherName,
            title,
            content,
            fileUrl,
            createdAt: serverTimestamp()
        });

        return NextResponse.json({ success: true, id: noteRef.id }, { status: 201 });
    } catch (error) {
        console.error('Note Create Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
