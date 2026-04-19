import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';


const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { message, previousMessages = [] } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        const messagesForAI = [
            { role: 'system', content: 'You are Smart Classroom AI, a helpful, encouraging, and knowledgeable study assistant for students. Help them understand concepts, guide them through learning, and be very concise.' },
            ...previousMessages,
            { role: 'user', content: message }
        ];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b:free',
                messages: messagesForAI,
            })
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to query AI" }, { status: 500 });
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message;

        // Optionally store chat history in DB here
        // ... omitted for simplicity, but could be added mapping to ChatHistory table

        return NextResponse.json({ reply: aiMessage }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
