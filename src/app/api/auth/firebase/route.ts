import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setCookieSession } from '@/lib/auth';
import { jwtVerify, createRemoteJWKSet } from 'jose';

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

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // New user - create them
            // If they didn't provide a role (requestedRole), we default to STUDENT
            const role = requestedRole === 'TEACHER' ? 'TEACHER' : 'STUDENT';
            
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: 'firebase-authenticated', // Placeholder
                    role,
                },
            });
        }

        // Set the session cookie using our existing auth logic
        await setCookieSession(user.id, user.role);

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
}
