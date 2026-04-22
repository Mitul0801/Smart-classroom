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

        try {
            const userDoc = await getDoc(doc(db, 'users', session.userId));
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() };
                return NextResponse.json({ authenticated: true, user: userData }, { status: 200 });
            }
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H6',location:'src/app/api/auth/me/route.ts:19',message:'Falling back to session-based profile after users lookup failure',data:{userId:session.userId,error:error instanceof Error ? error.message : 'unknown'},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
        }

        const fallbackUser = {
            id: session.userId,
            role: typeof session.role === 'string' ? session.role : 'STUDENT',
        };
        return NextResponse.json({ authenticated: true, user: fallbackUser }, { status: 200 });
    } catch (error) {
        console.error('Me Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
