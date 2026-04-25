'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useMutation, useQuery } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { BookOpen, BrainCircuit, Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { CtaButton } from '@/components/cta-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import type { QuizQuestion } from '@/lib/types';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  teacher: { name: string };
  createdAt: string;
  classroomId?: string;
}

interface PdfItem {
  id: string;
  teacher: { name: string };
  fileUrl: string;
  createdAt: string;
  summary?: string;
}

export default function StudentNotes() {
  const posthog = usePostHog();
  const [summaryState, setSummaryState] = useState<{ open: boolean; title: string; content: string; id: string }>({
    open: false,
    title: '',
    content: '',
    id: '',
  });
  const [quizState, setQuizState] = useState<{
    open: boolean;
    questions: QuizQuestion[];
    currentIndex: number;
    answers: string[];
  }>({
    open: false,
    questions: [],
    currentIndex: 0,
    answers: [],
  });

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: () => fetchJson<{ data: NoteItem[] }>('/api/notes').then((res) => res.data),
  });

  const pdfsQuery = useQuery({
    queryKey: ['pdfs'],
    queryFn: () => fetchJson<{ data: PdfItem[] }>('/api/pdf').then((res) => res.data),
  });

  const dashboardQuery = useQuery({
    queryKey: ['notes-dashboard'],
    queryFn: () => fetchJson<{ data: import('@/lib/types').DashboardPayload }>('/api/dashboard/student').then((res) => res.data),
  });

  const summarize = useMutation({
    mutationFn: (note: NoteItem) =>
      fetchJson<{ result: string }>('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: note.content,
          type: 'summarize',
          title: note.title,
          sourceType: 'NOTE',
          classroomId: note.classroomId || 'class-physics',
        }),
      }),
    onSuccess: (data, variables) => {
      setSummaryState({
        open: true,
        title: variables.title,
        content: data.result,
        id: variables.id,
      });
      posthog?.capture('summary_generated', { source: 'note' });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Summary failed');
    },
  });

  const quiz = useMutation({
    mutationFn: (summary: string) =>
      fetchJson<{ data: QuizQuestion[]; usage?: { count: number; remaining: number } }>('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      }),
    onSuccess: (data) => {
      setQuizState({
        open: true,
        questions: data.data,
        currentIndex: 0,
        answers: [],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Quiz generation failed');
    },
  });

  const currentQuestion = quizState.questions[quizState.currentIndex];
  const score = useMemo(
    () =>
      quizState.questions.reduce((total, question, index) => {
        return total + (quizState.answers[index] === question.answer ? 1 : 0);
      }, 0),
    [quizState.answers, quizState.questions],
  );

  if (notesQuery.isLoading || pdfsQuery.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <LoadingSkeleton lines={4} className="min-h-72" />
        <LoadingSkeleton lines={4} className="min-h-72" />
      </div>
    );
  }

  if (notesQuery.error || pdfsQuery.error) {
    return <ErrorState onRetry={() => { void notesQuery.refetch(); void pdfsQuery.refetch(); }} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Class content</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Explore uploaded notes and PDFs, then turn them into AI summaries and quiz yourself right away.
        </p>
      </div>

      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>PDF Summarize & Remember</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">How this works</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                '1. Open any note or PDF and generate an AI summary.',
                '2. Revisit the summary in the remember section below.',
                '3. Launch a quiz game from that summary to lock it in.',
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:bg-slate-950/60 dark:text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
            <p className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
              <BrainCircuit className="size-5 text-indigo-500" />
              Remember section
            </p>
            <div className="mt-4 space-y-3">
              {(dashboardQuery.data?.recentSummaries || []).slice(0, 3).map((summary) => (
                <div key={summary.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950/60">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{summary.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{summary.content}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Uploaded notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notesQuery.data?.map((note) => (
              <div key={note.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{note.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {note.teacher.name} • {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {note.fileUrl ? (
                    <a href={note.fileUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-2 dark:border-white/10">
                      <Download className="size-4" />
                    </a>
                  ) : null}
                </div>
                <div className="prose prose-sm mt-4 line-clamp-4 max-w-none dark:prose-invert">
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <CtaButton
                    type="button"
                    className="h-11 px-5"
                    onClick={() => summarize.mutate(note)}
                    disabled={summarize.isPending}
                  >
                    {summarize.isPending && summarize.variables?.id === note.id ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
                    Summarize
                  </CtaButton>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>PDF resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pdfsQuery.data?.map((pdf) => (
              <div key={pdf.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
                      <FileText className="size-4 text-rose-500" />
                      {pdf.fileUrl.split('/').pop() || 'PDF resource'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {pdf.teacher.name} • {new Date(pdf.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <a href={pdf.fileUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-2 dark:border-white/10">
                    <Download className="size-4" />
                  </a>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {pdf.summary || 'Ready to summarize with AI after review.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <CtaButton
                    type="button"
                    className="h-11 px-5"
                    onClick={() =>
                      summarize.mutate({
                        id: pdf.id,
                        title: pdf.fileUrl.split('/').pop() || 'PDF resource',
                        content: pdf.summary || 'Summarize this PDF for study revision.',
                        teacher: pdf.teacher,
                        createdAt: pdf.createdAt,
                        classroomId: 'class-physics',
                      })
                    }
                    disabled={summarize.isPending}
                  >
                    {summarize.isPending && summarize.variables?.id === pdf.id ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
                    Summarize PDF
                  </CtaButton>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={summaryState.open} onOpenChange={(open) => setSummaryState((prev) => ({ ...prev, open }))}>
        <DialogContent aria-label="AI summary" className="max-w-3xl rounded-[2rem] border-white/20 bg-white/95 dark:border-white/10 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>{summaryState.title}</DialogTitle>
          </DialogHeader>
          <div className="pretty-scrollbar max-h-[60vh] overflow-y-auto pr-2">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{summaryState.content}</ReactMarkdown>
            </div>
          </div>
          <div className="flex justify-end">
            <CtaButton type="button" className="h-11 px-5" onClick={() => quiz.mutate(summaryState.content)} disabled={quiz.isPending}>
              {quiz.isPending ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
              Generate Quiz
            </CtaButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quizState.open} onOpenChange={(open) => setQuizState((prev) => ({ ...prev, open }))}>
        <DialogContent aria-label="Summary quiz" className="max-w-2xl rounded-[2rem] border-white/20 bg-white/95 dark:border-white/10 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>AI Quiz Generator</DialogTitle>
          </DialogHeader>
          {currentQuestion ? (
            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Question {quizState.currentIndex + 1} of {quizState.questions.length}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {currentQuestion.question}
                </p>
              </div>
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant="outline"
                    className="h-auto justify-start rounded-2xl px-4 py-3 text-left"
                    onClick={async () => {
                      const nextAnswers = [...quizState.answers];
                      nextAnswers[quizState.currentIndex] = option;
                      const nextIndex = quizState.currentIndex + 1;
                      if (nextIndex < quizState.questions.length) {
                        setQuizState((prev) => ({ ...prev, answers: nextAnswers, currentIndex: nextIndex }));
                        return;
                      }

                      const nextScore = quizState.questions.reduce((total, question, index) => {
                        const chosen = index === quizState.currentIndex ? option : nextAnswers[index];
                        return total + (chosen === question.answer ? 1 : 0);
                      }, 0);

                      await fetchJson<{ success: boolean }>('/api/quiz', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          summaryId: summaryState.id,
                          score: nextScore,
                          total: quizState.questions.length,
                        }),
                      });
                      posthog?.capture('quiz_completion', { score: nextScore, total: quizState.questions.length });
                      setQuizState((prev) => ({ ...prev, answers: nextAnswers, currentIndex: nextIndex }));
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] bg-slate-50 p-6 text-center dark:bg-white/5">
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
                {score} / {quizState.questions.length}
              </p>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Quiz complete. Nice work.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
