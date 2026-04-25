'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Gamepad2, Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CtaButton } from '@/components/cta-button';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchJson } from '@/lib/api';
import type { DashboardPayload, QuizQuestion } from '@/lib/types';

export default function StudentGamesPage() {
  const [quizState, setQuizState] = useState<{
    open: boolean;
    summaryId: string;
    summaryTitle: string;
    questions: QuizQuestion[];
    currentIndex: number;
    answers: string[];
  }>({
    open: false,
    summaryId: '',
    summaryTitle: '',
    questions: [],
    currentIndex: 0,
    answers: [],
  });

  const dashboardQuery = useQuery({
    queryKey: ['games-dashboard'],
    queryFn: () => fetchJson<{ data: DashboardPayload }>('/api/dashboard/student').then((res) => res.data),
  });

  const startQuiz = useMutation({
    mutationFn: (summary: { id: string; title: string; content: string }) =>
      fetchJson<{ data: QuizQuestion[] }>('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: summary.content }),
      }).then((res) => ({ ...res, meta: summary })),
    onSuccess: (result) => {
      setQuizState({
        open: true,
        summaryId: result.meta.id,
        summaryTitle: result.meta.title,
        questions: result.data,
        currentIndex: 0,
        answers: [],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not start quiz game');
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

  if (dashboardQuery.isLoading) {
    return <LoadingSkeleton lines={5} className="min-h-96" />;
  }

  if (dashboardQuery.error || !dashboardQuery.data) {
    return <ErrorState onRetry={() => void dashboardQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>Quiz Games</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">Play from your summaries</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Pick any recent summary and turn it into a 5-question MCQ game. Finish it to earn +20 XP.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-300">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">XP rules for games</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Complete quiz game: +20 XP</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {dashboardQuery.data.recentSummaries.map((summary) => (
          <Card key={summary.id} className="glass-card rounded-[2rem]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{summary.title}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{summary.content}</p>
                </div>
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-300">
                  <Gamepad2 className="size-5" />
                </div>
              </div>
              <div className="mt-4">
                <CtaButton
                  type="button"
                  className="h-11 px-5"
                  onClick={() => startQuiz.mutate(summary)}
                  disabled={startQuiz.isPending}
                >
                  {startQuiz.isPending && startQuiz.variables?.id === summary.id ? <Loader2 className="size-4 animate-spin" /> : <Gamepad2 className="size-4" />}
                  Play quiz game
                </CtaButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={quizState.open} onOpenChange={(open) => setQuizState((prev) => ({ ...prev, open }))}>
        <DialogContent aria-label="Quiz game" className="max-w-2xl rounded-[2rem] border-white/20 bg-white/95 dark:border-white/10 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>{quizState.summaryTitle || 'Quiz Game'}</DialogTitle>
          </DialogHeader>
          {currentQuestion ? (
            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Question {quizState.currentIndex + 1} of {quizState.questions.length}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{currentQuestion.question}</p>
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
                          summaryId: quizState.summaryId,
                          score: nextScore,
                          total: quizState.questions.length,
                        }),
                      });
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
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Game complete</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                {score} / {quizState.questions.length}
              </p>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Nice work. You earned quiz XP for completing this round.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
