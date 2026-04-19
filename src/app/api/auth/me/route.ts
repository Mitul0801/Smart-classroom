import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const userDoc = await getDoc(doc(db, 'users', session.userId));

        if (!userDoc.exists()) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const userData = { id: userDoc.id, ...userDoc.data() };

        return NextResponse.json({ authenticated: true, user: userData }, { status: 200 });
    } catch (error) {
        console.error('Me Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
