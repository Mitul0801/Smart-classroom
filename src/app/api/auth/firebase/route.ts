import { NextResponse } from 'next/server';
import { setCookieSession } from '@/lib/auth';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { adminDb } from '@/lib/firebase-admin';

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

        // Use Admin SDK to manage user in Firestore
        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();
        
        let finalRole = role;
        if (userDoc.exists) {
            // Persist the existing role
            finalRole = userDoc.data()?.role || role;
        } else {
            // New user signup
            await userRef.set({
                name,
                email,
                role,
                createdAt: new Date()
            });
        }

        const userData = { id: uid, name, email, role: finalRole };

        // Set the session cookie
        await setCookieSession(userData.id, userData.role);

        return NextResponse.json({ success: true, user: userData });
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        const message = error instanceof Error ? error.message : 'Authentication failed';
        return NextResponse.json({ error: message }, { status: 401 });
    }
}
