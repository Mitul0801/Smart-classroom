import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { text, type } = await req.json(); // type: 'summarize' or 'explain'

        if (!text) {
            return NextResponse.json({ error: 'Missing text content' }, { status: 400 });
        }

        let systemPrompt = '';
        if (type === 'summarize') {
            systemPrompt = 'You are an expert educational summarizer. Provide a concise summary and list of key points for the provided text. Format the output in clean markdown.';
        } else {
            systemPrompt = 'You are a helpful and friendly AI teacher. Explain the following topic/text in simple, easy-to-understand terms suitable for a student. Use analogies if helpful. Format the output in clean markdown.';
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3-8b-instruct:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('OpenRouter error:', err);
            return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return NextResponse.json({ result: content }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
