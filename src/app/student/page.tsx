'use client';

import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, BrainCircuit, CheckCircle2, Flame, Gamepad2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/error-state';
import { LivePollModal } from '@/components/live-poll-modal';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { NotificationBanner } from '@/components/notification-banner';
import { ProfileXpCard } from '@/components/profile-xp-card';
import { WelcomeBanner } from '@/components/welcome-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchJson } from '@/lib/api';
import { fetchNotificationPreference, markNotificationPreference, subscribeToLivePoll, voteOnPoll } from '@/lib/firebase/services';
import type { DashboardPayload } from '@/lib/types';

export default function StudentDashboard() {
  const router = useRouter();
  const posthog = usePostHog();
  const queryClient = useQueryClient();
  const [livePoll, setLivePoll] = React.useState<import('@/lib/types').LivePoll | null>(null);
  const [pollOpen, setPollOpen] = React.useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => fetchJson<{ data: DashboardPayload }>('/api/dashboard/student').then((res) => res.data),
  });
  const attendanceQuery = useQuery({
    queryKey: ['student-attendance-portal'],
    queryFn: () =>
      fetchJson<{
        data: {
          markedToday: boolean;
          todayStatus: 'PRESENT' | 'ABSENT' | null;
          records: Array<{ id: string; status: 'PRESENT' | 'ABSENT'; date: string }>;
        };
      }>('/api/attendance/me').then((res) => res.data),
  });
  const attendanceMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ success: boolean }>('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PRESENT' }),
      }),
    onSuccess: async () => {
      toast.success('Attendance marked for today');
      await queryClient.invalidateQueries({ queryKey: ['student-attendance-portal'] });
      posthog?.capture('attendance_marked');
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Could not mark attendance');
    },
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    fetchNotificationPreference(data.user.id)
      .then(async (enabled) => {
        if (enabled || typeof window === 'undefined' || !('Notification' in window)) {
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await markNotificationPreference(data.user.id, true);
        }
      })
      .catch(() => undefined);
  }, [data]);

  useEffect(() => {
    if (!data?.announcements[0] || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    if (Notification.permission === 'granted') {
      const latest = data.announcements[0];
      const timestamp = sessionStorage.getItem('smartclass-last-notification');
      if (timestamp !== latest.id) {
        new Notification('SmartClass AI', {
          body: latest.message,
        });
        sessionStorage.setItem('smartclass-last-notification', latest.id);
      }
    }
  }, [data]);

  useEffect(() => {
    if (!data?.classrooms[0]) {
      return;
    }
    const unsubscribe = subscribeToLivePoll(data.classrooms[0].id, (poll) => {
      setLivePoll(poll);
      setPollOpen(Boolean(poll?.active));
    });
    return unsubscribe;
  }, [data?.classrooms]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton lines={3} className="min-h-40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <LoadingSkeleton lines={4} />
          <LoadingSkeleton lines={4} />
          <LoadingSkeleton lines={4} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner name={data.user.name} dateLabel={data.dateLabel} />
      <NotificationBanner announcement={data.announcements[0] || null} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <Card className="glass-card rounded-[2rem]">
            <CardHeader>
              <CardTitle>Study modes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: 'PDF Summarize & Remember',
                  description: 'Open class content, summarize uploaded PDFs, and review key ideas again later.',
                  icon: BookOpen,
                  href: '/student/notes',
                },
                {
                  title: 'Quiz Games',
                  description: 'Turn summaries into quick MCQ games and earn more XP for finishing them.',
                  icon: Gamepad2,
                  href: '/student/games',
                },
                {
                  title: 'AI Study Assistant',
                  description: 'Ask questions, clear doubts, and earn chat XP while you revise.',
                  icon: BrainCircuit,
                  href: '/student/chat',
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-950/60"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-300">
                    <item.icon className="size-5" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card rounded-[2rem]">
            <CardHeader>
              <CardTitle>Your classrooms</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {data.classrooms.map((classroom) => (
                <button
                  key={classroom.id}
                  type="button"
                  onClick={() => router.push('/student/notes')}
                  className={`rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-950/60 ${classroom.accent} border-l-4`}
                >
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{classroom.name}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{classroom.teacherName}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {classroom.lastActivity}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card rounded-[2rem]">
            <CardHeader>
              <CardTitle>Recent AI summaries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{summary.title}</p>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                      {summary.sourceType}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{summary.content}</p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => router.push('/student/games')}
                    >
                      <Gamepad2 className="size-4" />
                      Generate Quiz
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card rounded-[2rem]">
            <CardHeader>
              <CardTitle>Attendance portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Today&apos;s attendance</p>
                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {attendanceQuery.data?.todayStatus === 'PRESENT' ? 'Marked Present' : 'Not marked yet'}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  When you mark attendance here, it appears in the teacher attendance dashboard too.
                </p>
              </div>
              <Button
                type="button"
                className="w-full rounded-2xl bg-linear-to-r from-emerald-600 to-teal-500 text-white"
                disabled={attendanceMutation.isPending || attendanceQuery.data?.markedToday}
                onClick={() => attendanceMutation.mutate()}
              >
                <CheckCircle2 className="size-4" />
                {attendanceQuery.data?.markedToday ? 'Already marked today' : attendanceMutation.isPending ? 'Marking...' : 'Mark Present'}
              </Button>
              <div className="space-y-3">
                {(attendanceQuery.data?.records || []).slice(0, 3).map((record) => (
                  <div key={record.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950/60">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${record.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'}`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <ProfileXpCard
            xp={data.progress.xp}
            nextLevelXp={data.progress.nextLevelXp}
            badges={data.progress.badges}
          />
          <Card className="glass-card rounded-[2rem]">
            <CardHeader>
              <CardTitle>Assignments due soon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.assignments.slice(0, 4).map((assignment) => (
                <div
                  key={assignment.id}
                  className={`rounded-[1.5rem] border p-4 ${assignment.overdue ? 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/60'}`}
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{assignment.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {assignment.subject} • Due {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="glass-card rounded-[2rem]">
            <CardHeader>
              <CardTitle>Momentum snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Quiz average</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  {data.progress.averageQuizScore}%
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-white/5">
                <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Flame className="size-4 text-orange-500" />
                  Days active
                </p>
                <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  {data.progress.streakDays}
                </p>
              </div>
              <div className="col-span-full rounded-[1.5rem] bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">How XP is measured</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {data.progress.xpRules.map((rule) => (
                    <div key={rule.label} className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950/60">
                      <p className="font-semibold text-slate-900 dark:text-slate-50">+{rule.xp} XP</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{rule.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  posthog?.capture('nav_to_progress');
                  router.push('/student/progress');
                }}
                className="col-span-full rounded-[1.5rem] bg-linear-to-r from-indigo-600 to-purple-600 p-4 text-left text-white transition hover:scale-[1.01]"
              >
                <p className="flex items-center gap-2 text-sm text-white/80">
                  <Sparkles className="size-4" />
                  Open full progress dashboard
                </p>
                <p className="mt-2 text-lg font-semibold">See charts, stats, and badge milestones</p>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
      <LivePollModal
        poll={livePoll}
        open={pollOpen}
        onOpenChange={setPollOpen}
        onVote={(optionId) => {
          if (!livePoll || !data) {
            return;
          }
          void voteOnPoll(livePoll.classId, livePoll.id, optionId, data.user.id);
        }}
      />
    </div>
  );
}
