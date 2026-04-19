import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'fallback_secret';
const key = new TextEncoder().encode(secretKey);

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    // Check if the route is protected
    const isStudentRoute = pathname.startsWith('/student');
    const isTeacherRoute = pathname.startsWith('/teacher');
    const isRegisterRoute = pathname === '/register';

    if (isRegisterRoute) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (isStudentRoute || isTeacherRoute) {
        const session = req.cookies.get('session')?.value;

        if (!session) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        try {
            const { payload } = await jwtVerify(session, key, {
                algorithms: ['HS256'],
            });

            const role = payload.role as string;

            // Role-based access control
            if (isStudentRoute && role !== 'STUDENT') {
                return NextResponse.redirect(new URL('/teacher', req.url));
            }
            if (isTeacherRoute && role !== 'TEACHER') {
                return NextResponse.redirect(new URL('/student', req.url));
            }

            return NextResponse.next();
        } catch (error) {
            console.error('Proxy: Session verification failed', error);
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/student/:path*', '/teacher/:path*'],
};
