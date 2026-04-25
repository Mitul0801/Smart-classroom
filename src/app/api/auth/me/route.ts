import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserDocument } from '@/lib/firebase/admin-services';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const userData = await getUserDocument(session.userId);

        return NextResponse.json({ authenticated: true, user: userData }, { status: 200 });
    } catch (error) {
        console.error('Me Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
