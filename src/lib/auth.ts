import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is missing');
}
const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export interface SessionPayload extends Record<string, unknown> {
    userId: string;
    role: string;
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload as SessionPayload;
    } catch {
        return null;
    }
}

export async function setCookieSession(userId: string, role: string) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const session = await encrypt({ userId, role, expires });

    const cookiesStore = await cookies();
    cookiesStore.set('session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

export async function getSession() {
    const cookiesStore = await cookies();
    const session = cookiesStore.get('session');
    
    if (!session) return null;
    return await decrypt(session.value);
}

export async function clearSession() {
    const cookiesStore = await cookies();
    cookiesStore.delete('session');
}
