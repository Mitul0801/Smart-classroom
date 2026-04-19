'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { BrainCircuit, Send, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function StudentChat() {
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    async function sendMsg(e: React.FormEvent) {
        e.preventDefault();
        if(!input.trim() || loading) return;

        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ message: input, previousMessages: messages }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessages([...newMessages, data.reply]);
            } else {
                setMessages([...newMessages, { role: 'system', content: 'Connection error' }]);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-full flex flex-col p-6 max-w-4xl mx-auto relative z-10 w-full">
            <h1 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <BrainCircuit className="text-indigo-400" />
                AI Study Assistant
            </h1>

            <Card className="flex-1 flex flex-col overflow-hidden bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md">
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                            <BrainCircuit className="w-16 h-16 mb-4" />
                            <p>Ask anything related to your studies!</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <BrainCircuit className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-100' : 'bg-indigo-950/50 border border-indigo-900/50 text-indigo-100'}`}>
                                {msg.role === 'user' ? msg.content : (
                                    <div className="prose prose-invert prose-indigo max-w-none text-sm">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
                                <BrainCircuit className="w-5 h-5 text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-indigo-950/50 border border-indigo-900/50 text-indigo-300">
                                Thinking...
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                    <form onSubmit={sendMsg} className="flex items-center gap-3">
                        <Input 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            placeholder="Type your question..." 
                            className="flex-1 bg-zinc-900 border-zinc-700 h-12 rounded-xl focus-visible:ring-indigo-500 text-zinc-100" 
                        />
                        <Button type="submit" disabled={loading} size="icon" className="h-12 w-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-md">
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
