import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { enforceDailyAiLimit, generateSummary } from '@/lib/ai';
import { saveSummary } from '@/lib/firebase/admin-services';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { text, type, title = 'AI Summary', sourceType = 'NOTE', classroomId = 'class-physics' } =
            (await req.json()) as {
                text?: string;
                type: 'summarize' | 'explain';
                title?: string;
                sourceType?: 'NOTE' | 'PDF';
                classroomId?: string;
            };

        if (!text) {
            return NextResponse.json({ error: 'Missing text content' }, { status: 400 });
        }

        await enforceDailyAiLimit(session.userId);
        const content = await generateSummary(text, type);

        if (type === 'summarize') {
            await saveSummary({
                userId: session.userId,
                title,
                content,
                sourceType,
                classroomId,
            });
        }

        return NextResponse.json({ result: content }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.message === 'DAILY_LIMIT_REACHED') {
            return NextResponse.json(
                { error: 'Daily limit reached', count: 20, remaining: 0 },
                { status: 429 },
            );
        }
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
