import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const pdfs = await prisma.pdf.findMany({
            include: { teacher: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ data: pdfs }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
