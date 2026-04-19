import { NextResponse } from 'next/server';
import { setCookieSession } from '@/lib/auth';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export async function POST(req: Request) {
    try {
        const { idToken, role: requestedRole } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        // Verify the Firebase ID Token
        const { payload } = await jwtVerify(idToken, JWKS, {
            issuer: 'https://securetoken.google.com/smart-classroom-3a3d1',
            audience: 'smart-classroom-3a3d1',
        });

        const email = payload.email as string;
        const name = (payload.name as string) || email.split('@')[0];

        if (!email) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
        }

        // Find user in Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        let userData: { id: string, role: string, [key: string]: any };
        if (querySnapshot.empty) {
            // New user - create in Firestore
            const role = requestedRole === 'TEACHER' ? 'TEACHER' : 'STUDENT';
            const newUser = {
                name,
                email,
                role,
                createdAt: serverTimestamp(),
            };
            const docRef = await addDoc(usersRef, newUser);
            userData = { id: docRef.id, ...newUser };
        } else {
            // Existing user
            const doc = querySnapshot.docs[0];
            userData = { id: doc.id, ...(doc.data() as { role: string, [key: string]: any }) };
        }

        // Set the session cookie
        await setCookieSession(userData.id, userData.role as string);

        return NextResponse.json({ success: true, user: userData });
    } catch (error: any) {
        console.error('Firebase Auth Error:', error);
        return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 401 });
    }
}
