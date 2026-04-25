'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bookmark, BrainCircuit, Loader2, Send, User } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { fetchJson } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function StudentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const posthog = usePostHog();
  const historyQuery = useQuery({
    queryKey: ['chat-history'],
    queryFn: () =>
      fetchJson<{ data: Array<{ role: 'user' | 'assistant'; content: string }> }>('/api/chat/history').then(
        (res) => res.data,
      ),
  });

  const sendMessage = useMutation({
    mutationFn: (payload: { message: string; previousMessages: Message[] }) =>
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          try {
            const data = JSON.parse(text) as { error?: string };
            throw new Error(data.error || 'Chat failed');
          } catch {
            throw new Error(text || 'Chat failed');
          }
        }
        return text;
      }),
    onSuccess: (assistantMessage, variables) => {
      setMessages([...variables.previousMessages, { role: 'user', content: variables.message }, { role: 'assistant', content: assistantMessage }]);
      posthog?.capture('ai_chat_message_sent');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Chat failed');
    },
  });

  const saveBookmark = useMutation({
    mutationFn: (content: string) =>
      fetchJson<{ success: boolean }>('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Study Assistant', content }),
      }),
    onSuccess: () => toast.success('Saved to My Notes'),
    onError: () => toast.error('Could not save note'),
  });

  useEffect(() => {
    if (historyQuery.data && messages.length === 0) {
      setMessages(historyQuery.data);
    }
  }, [historyQuery.data, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">AI Study Assistant</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Ask for explanations, examples, or quick recaps. Save useful answers straight into My Notes.
        </p>
      </div>

      <Card className="glass-card flex min-h-[70vh] flex-col overflow-hidden rounded-[2rem]">
        <div ref={scrollRef} className="pretty-scrollbar flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
          {historyQuery.isLoading ? (
            <div className="space-y-4">
              <LoadingSkeleton lines={3} />
              <LoadingSkeleton lines={2} />
            </div>
          ) : null}
          {messages.length === 0 && (
            <div className="flex h-full min-h-80 flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
              <BrainCircuit className="mb-4 size-14 text-indigo-500" />
              <p className="text-lg font-medium">Ask anything about your study materials.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
              <div className={`flex max-w-[92%] gap-3 sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl ${message.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>
                  {message.role === 'user' ? <User className="size-4" /> : <BrainCircuit className="size-4" />}
                </div>
                <div className={`rounded-[1.5rem] px-4 py-3 ${message.role === 'user' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-indigo-200 bg-indigo-50 text-slate-800 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-slate-100'}`}>
                  {message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    <>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => saveBookmark.mutate(message.content)}
                        >
                          <Bookmark className="size-4" />
                          Save note
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-500 text-white">
                <BrainCircuit className="size-4" />
              </div>
              <div className="rounded-[1.5rem] border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-slate-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking...
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/60">
          <form
            className="flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!input.trim() || sendMessage.isPending) {
                return;
              }
              const previousMessages = [...messages];
              const message = input.trim();
              setInput('');
              setMessages([...previousMessages, { role: 'user', content: message }]);
              sendMessage.mutate({ message, previousMessages });
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask your next question..."
              className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5"
            />
            <Button type="submit" className="h-12 rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
