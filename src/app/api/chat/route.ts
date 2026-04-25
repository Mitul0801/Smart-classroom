import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { enforceDailyAiLimit, generateWithGemini } from '@/lib/ai';
import { saveChatTranscript } from '@/lib/firebase/admin-services';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, previousMessages = [] } = (await req.json()) as {
            message?: string;
            previousMessages?: Array<{ role: string; content: string }>;
        };

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        await enforceDailyAiLimit(session.userId);

        const transcript = [...previousMessages, { role: 'user', content: message }]
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n');
        const fullContent = await generateWithGemini(
            [
                'You are Smart Classroom AI, a helpful, encouraging study assistant.',
                'Be concise, accurate, and student-friendly.',
                '',
                transcript,
            ].join('\n'),
        );

        await saveChatTranscript({
            userId: session.userId,
            message,
            assistantMessage: fullContent,
        });

        return new Response(fullContent);
    } catch (error) {
        if (error instanceof Error && error.message === 'DAILY_LIMIT_REACHED') {
            return NextResponse.json(
                { error: 'Daily limit reached', count: 20, remaining: 0 },
                { status: 429 },
            );
        }
        console.error('Chat Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
