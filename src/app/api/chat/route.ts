import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function getAiKeys() {
    return {
        openRouterKey: process.env.OPENROUTER_API_KEY,
        geminiKey:
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    };
}

export async function POST(req: Request) {
    try {
        const { openRouterKey, geminiKey } = getAiKeys();
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!geminiKey && !openRouterKey) {
            return NextResponse.json({ error: 'AI service key missing' }, { status: 500 });
        }
        // #region agent log
        fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H10',location:'src/app/api/chat/route.ts:24',message:'AI provider key availability at request time',data:{hasGeminiKey:Boolean(geminiKey),hasOpenRouterKey:Boolean(openRouterKey)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        const { message, previousMessages = [] } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        const messagesForAI = [
            { role: 'system', content: 'You are Smart Classroom AI, a helpful, encouraging, and knowledgeable study assistant for students. Help them understand concepts, guide them through learning, and be very concise.' },
            ...previousMessages,
            { role: 'user', content: message }
        ];

        let aiMessage: { role: string; content: string } | null = null;
        let geminiFailure: { status: number; detail: string } | null = null;
        let openRouterFailure: { status: number; detail: string } | null = null;

        if (geminiKey) {
            const transcript = messagesForAI
                .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
                .join('\n\n');
            const geminiPrompt = `You are Smart Classroom AI, a helpful, encouraging, and knowledgeable study assistant for students. Help them understand concepts, guide them through learning, and be very concise.\n\nConversation:\n${transcript}`;
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: geminiPrompt }] }],
                }),
            });
            if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                const content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H9',location:'src/app/api/chat/route.ts:56',message:'Gemini response received',data:{hasContent:Boolean(content)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                if (content) {
                    aiMessage = { role: 'assistant', content };
                }
            } else {
                const errText = await geminiResponse.text();
                geminiFailure = { status: geminiResponse.status, detail: errText.slice(0, 200) };
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H9',location:'src/app/api/chat/route.ts:63',message:'Gemini request failed',data:{status:geminiResponse.status,errorSnippet:errText.slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            }
        }

        if (!aiMessage && openRouterKey) {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.3-70b-instruct:free',
                    messages: messagesForAI,
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                openRouterFailure = { status: response.status, detail: errText.slice(0, 200) };
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H8',location:'src/app/api/chat/route.ts:84',message:'OpenRouter request failed',data:{status:response.status,errorSnippet:errText.slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            } else {
                const data = await response.json();
                const content = data?.choices?.[0]?.message?.content;
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H8',location:'src/app/api/chat/route.ts:90',message:'OpenRouter response received',data:{hasContent:Boolean(content)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                if (content) {
                    aiMessage = { role: 'assistant', content };
                }
            }
        }

        if (!aiMessage) {
            const reason = geminiFailure?.detail ?? openRouterFailure?.detail ?? 'No provider returned a valid response';
            return NextResponse.json({ error: `AI provider unavailable. ${reason}` }, { status: 502 });
        }

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
