import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { enforceDailyAiLimit, generateQuizFromSummary } from '@/lib/ai';
import { saveQuizAttempt } from '@/lib/firebase/admin-services';
import type { QuizQuestion } from '@/lib/types';

function parseQuiz(content: string): QuizQuestion[] {
  try {
    const parsed = JSON.parse(content) as { questions?: QuizQuestion[] };
    return Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { summary?: string };
  if (!body.summary?.trim()) {
    return NextResponse.json({ error: 'Missing summary' }, { status: 400 });
  }

  try {
    const usage = await enforceDailyAiLimit(session.userId);
    const raw = await generateQuizFromSummary(body.summary);
    const questions = parseQuiz(raw);

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Quiz generation failed' }, { status: 502 });
    }

    return NextResponse.json({
      data: questions.slice(0, 5),
      usage,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'DAILY_LIMIT_REACHED') {
      return NextResponse.json(
        { error: 'Daily limit reached', count: 20, remaining: 0 },
        { status: 429 },
      );
    }
    console.error('Quiz generation error', error);
    return NextResponse.json({ error: 'Quiz generation failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { summaryId?: string; score?: number; total?: number };
  if (!body.summaryId || typeof body.score !== 'number' || typeof body.total !== 'number') {
    return NextResponse.json({ error: 'Missing quiz result' }, { status: 400 });
  }

  await saveQuizAttempt({
    userId: session.userId,
    summaryId: body.summaryId,
    score: body.score,
    total: body.total,
  });

  return NextResponse.json({ success: true });
}
