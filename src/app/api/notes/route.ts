import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const snapshot = await adminDb.collection('notes').orderBy('createdAt', 'desc').get();
        
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
        console.log('--- Notes POST Started ---');
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') {
            console.error('Notes: Unauthorized or not a teacher', session?.role);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, content, fileUrl } = await req.json();
        console.log(`Notes: Publishing note "${title}" by teacher ${session.userId}`);

        if (!title) {
            return NextResponse.json({ error: 'Missing title' }, { status: 400 });
        }

        const teacherDoc = await adminDb.collection('users').doc(session.userId).get();
        const teacherData = teacherDoc.exists ? teacherDoc.data() : { name: 'Unknown Teacher' };

        const noteRef = await adminDb.collection('notes').add({
            teacherId: session.userId,
            teacher: {
                name: teacherData?.name || 'Unknown Teacher'
            },
            title: title || '',
            content: content || '',
            fileUrl: fileUrl || null,
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, id: noteRef.id }, { status: 201 });
    } catch (error) {
        console.error('Note Create Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
