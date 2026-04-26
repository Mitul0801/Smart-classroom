import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { enforceDailyAiLimit } from '@/lib/ai';
import { saveChatTranscript } from '@/lib/firebase/admin-services';

export async function POST(req: Request) {
    try {
        console.log('--- Chat API Started (Streaming) ---');
        const session = await getSession();
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 });
        }

        const { message, previousMessages = [] } = (await req.json()) as {
            message?: string;
            previousMessages?: Array<{ role: string; content: string }>;
        };

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        // Check daily limit
        await enforceDailyAiLimit(session.userId);

        const systemPrompt = 'You are Smart Classroom AI, a helpful, encouraging study assistant. Be concise and accurate.';

        // Format conversation for Gemini
        const transcript = [...previousMessages, { role: 'user', content: message }]
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\n${transcript}` }] }],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API Error:', errorData);
            return NextResponse.json({ error: 'AI Service Error. You might have hit your rate limit.' }, { status: response.status });
        }

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                const decoder = new TextDecoder();
                let assistantMessage = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.slice(6));
                                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                                    if (text) {
                                        assistantMessage += text;
                                        controller.enqueue(new TextEncoder().encode(text));
                                    }
                                } catch (e) {
                                    // Ignore parse errors
                                }
                            }
                        }
                    }

                    // Save to history in background
                    if (assistantMessage) {
                        saveChatTranscript({
                            userId: session.userId,
                            message,
                            assistantMessage
                        }).catch(e => console.error('History Error:', e));
                    }
                } catch (e) {
                    console.error('Streaming Error:', e);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'DAILY_LIMIT_REACHED') {
            return NextResponse.json(
                { error: 'Daily limit reached (20 messages). Please try again tomorrow!' },
                { status: 429 }
            );
        }
        console.error('Chat Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
