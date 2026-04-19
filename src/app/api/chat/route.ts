import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
                model: 'meta-llama/llama-3.3-70b-instruct:free',
                messages: messagesForAI,
            })
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to query AI" }, { status: 500 });
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message;

        // Store chat history in Firestore
        try {
            await addDoc(collection(db, 'chatHistory'), {
                userId: session.userId,
                messages: JSON.stringify([...messagesForAI, aiMessage]),
                createdAt: serverTimestamp()
            });
        } catch (dbError) {
            console.error('Error saving chat history:', dbError);
            // Non-critical, we can still return the AI reply
        }

        return NextResponse.json({ reply: aiMessage }, { status: 200 });
    } catch (error) {
        console.error('Chat Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
