import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const filterDate = url.searchParams.get('date');

        let records;
        if (session.role === 'TEACHER') {
            const query: Record<string, unknown> = {};
            if (filterDate) {
                const startOfDay = new Date(filterDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filterDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.date = { gte: startOfDay, lte: endOfDay };
            }
            records = await prisma.attendance.findMany({
                where: query,
                include: { student: { select: { name: true, email: true } } },
                orderBy: { date: 'desc' }
            });
        } else {
            // Student gets their own records
            records = await prisma.attendance.findMany({
                where: { studentId: session.userId },
                orderBy: { date: 'desc' }
            });
        }

        return NextResponse.json({ data: records }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await req.json();
        
        // Prevent multiple entries per day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await prisma.attendance.findFirst({
            where: {
                studentId: session.userId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Attendance already marked today' }, { status: 400 });
        }

        const record = await prisma.attendance.create({
            data: {
                studentId: session.userId,
                status: status === 'PRESENT' ? 'PRESENT' : 'ABSENT',
                date: new Date()
            }
        });

        return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
