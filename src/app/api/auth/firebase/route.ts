import { NextResponse } from 'next/server';
import { setCookieSession } from '@/lib/auth';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { ensureUserDocument } from '@/lib/firebase/admin-services';

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export async function POST(req: Request) {
    try {
        const { idToken, role: requestedRole } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (!projectId) {
            return NextResponse.json({ error: 'Firebase config missing' }, { status: 500 });
        }

        // Verify the Firebase ID Token
        const { payload } = await jwtVerify(idToken, JWKS, {
            issuer: `https://securetoken.google.com/${projectId}`,
            audience: projectId,
        });

        const email = payload.email as string;
        const uid = payload.sub as string;
        const name = (payload.name as string) || email?.split('@')[0] || 'User';
        const role = requestedRole === 'TEACHER' ? 'TEACHER' : 'STUDENT';

        if (!email || !uid) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
        }

        const userData = await ensureUserDocument({
            uid,
            name,
            email,
            role,
        });

        // Set the session cookie
        await setCookieSession(userData.id, userData.role);

        return NextResponse.json({ success: true, user: userData });
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        const message = error instanceof Error ? error.message : 'Authentication failed';
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
