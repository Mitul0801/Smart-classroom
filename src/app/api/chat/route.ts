import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

function getAiKeys() {
    return {
        openRouterKey: process.env.OPENROUTER_API_KEY,
        geminiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    };
}

export async function POST(req: Request) {
    try {
        console.log('--- Chat API Started ---');
        const { openRouterKey, geminiKey } = getAiKeys();
        const session = await getSession();
        if (!session) {
            console.error('Chat: No session found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { message, previousMessages = [] } = await req.json();
        console.log(`Chat: Received message from user ${session.userId}: ${message.slice(0, 50)}...`);

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        const systemPrompt = 'You are Smart Classroom AI, a helpful, encouraging, and knowledgeable study assistant for students. Help them understand concepts, guide them through learning, and be very concise.';

        // We use OpenRouter as primary because it has a free Gemini model!
        if (openRouterKey) {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Using Gemini 2.0 Flash Lite Free via OpenRouter
                    model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
                    stream: true,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...previousMessages,
                        { role: 'user', content: message }
                    ],
                })
            });

            if (!response.ok) {
                return NextResponse.json({ error: 'AI provider error' }, { status: response.status });
            }

            // Create a custom ReadableStream to parse OpenRouter's SSE format
            const stream = new ReadableStream({
                async start(controller) {
                    const reader = response.body?.getReader();
                    if (!reader) return;

                    const decoder = new TextDecoder();
                    let fullContent = '';

                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const chunk = decoder.decode(value);
                            const lines = chunk.split('\n').filter(line => line.trim() !== '');

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const data = line.slice(6);
                                    if (data === '[DONE]') continue;
                                    try {
                                        const parsed = JSON.parse(data);
                                        const content = parsed.choices[0]?.delta?.content || '';
                                        if (content) {
                                            fullContent += content;
                                            controller.enqueue(content);
                                        }
                                    } catch (e) {
                                        // Ignore parse errors for individual chunks
                                    }
                                }
                            }
                        }

                        // Save history in background after stream finishes
                        adminDb.collection('chatHistory').add({
                            userId: session.userId,
                            messages: JSON.stringify([
                                ...previousMessages,
                                { role: 'user', content: message },
                                { role: 'assistant', content: fullContent }
                            ]),
                            createdAt: new Date()
                        }).catch(e => console.error('History error', e));

                    } catch (e) {
                        controller.error(e);
                    } finally {
                        controller.close();
                    }
                }
            });

            return new Response(stream);
        }

        return NextResponse.json({ error: 'AI provider unavailable' }, { status: 502 });
    } catch (error) {
        console.error('Chat Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
