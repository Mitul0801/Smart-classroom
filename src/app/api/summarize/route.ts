import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!GEMINI_API_KEY && !OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'AI service key missing' }, { status: 500 });
        }

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

        let content: string | null = null;

        if (GEMINI_API_KEY) {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\n${text}` }] }],
                }),
            });
            if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H9',location:'src/app/api/summarize/route.ts:45',message:'Gemini summarize response received',data:{hasContent:Boolean(content)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            } else {
                const err = await geminiResponse.text();
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H9',location:'src/app/api/summarize/route.ts:50',message:'Gemini summarize request failed',data:{status:geminiResponse.status,errorSnippet:err.slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            }
        }

        if (!content && OPENROUTER_API_KEY) {
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

            if (response.ok) {
                const data = await response.json();
                content = data?.choices?.[0]?.message?.content ?? null;
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H8',location:'src/app/api/summarize/route.ts:73',message:'OpenRouter summarize response received',data:{hasContent:Boolean(content)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            } else {
                const err = await response.text();
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'post-fix',hypothesisId:'H8',location:'src/app/api/summarize/route.ts:78',message:'OpenRouter summarize request failed',data:{status:response.status,errorSnippet:err.slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            }
        }

        if (!content) {
            return NextResponse.json({ error: 'AI provider unavailable. Please try again.' }, { status: 502 });
        }

        return NextResponse.json({ result: content }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
