import { incrementUsageForToday } from '@/lib/firebase/admin-services';

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function enforceDailyAiLimit(userId: string) {
  try {
    return await incrementUsageForToday(userId);
  } catch (error) {
    if (error instanceof Error && error.message === 'DAILY_LIMIT_REACHED') {
      throw new Error('DAILY_LIMIT_REACHED');
    }
    throw error;
  }
}

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('AI service key missing');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI provider error: ${text.slice(0, 120)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Empty AI response');
  }

  return content;
}

export async function generateQuizFromSummary(summary: string): Promise<string> {
  return generateWithGemini(
    [
      'You are SmartClass AI.',
      'Create exactly 5 multiple-choice questions from the summary below.',
      'Return strict JSON matching this schema:',
      '{"questions":[{"id":"q1","question":"...","options":["A","B","C","D"],"answer":"Exact correct option text"}]}',
      'Do not wrap in markdown fences.',
      '',
      summary,
    ].join('\n'),
  );
}

export async function generateSummary(text: string, type: 'summarize' | 'explain'): Promise<string> {
  const systemPrompt =
    type === 'summarize'
      ? 'Summarize the text into a student-friendly markdown outline with key ideas, definitions, and quick recall bullets.'
      : 'Explain the text simply for a student using markdown, examples, and short sections.';

  return generateWithGemini(`${systemPrompt}\n\n${text}`);
}
