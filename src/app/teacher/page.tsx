'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BarChart3, BellRing, Users2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { WelcomeBanner } from '@/components/welcome-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import { createLivePoll, createTeacherAnnouncement } from '@/lib/firebase/services';
import type { Classroom } from '@/lib/types';

interface TeacherPayload {
  user: { name: string };
  classrooms: Classroom[];
  attendance: { present: number; absent: number };
  assignments: Array<{ id: string; title: string; submittedCount?: number; pendingCount?: number; dueDate: string }>;
  announcements: Array<{ id: string; title: string; message: string }>;
  performance: Array<{ id: string; name: string; lastActive: string; pdfsRead: number; quizzesTaken: number; engagement: 'LOW' | 'MEDIUM' | 'HIGH' }>;
}

export default function TeacherDashboard() {
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [poll, setPoll] = useState({ question: '', options: 'Option A\nOption B' });
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const query = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: () => fetchJson<{ data: TeacherPayload }>('/api/dashboard/teacher').then((res) => res.data),
  });

  const currentClassroom = useMemo(() => query.data?.classrooms[0], [query.data]);

  const postAnnouncement = useMutation({
    mutationFn: async () => {
      if (!currentClassroom) {
        throw new Error('No classroom available');
      }
      await createTeacherAnnouncement({
        classId: currentClassroom.id,
        title: announcement.title,
        message: announcement.message,
      });
    },
    onSuccess: () => {
      toast.success('Announcement posted');
      setAnnouncement({ title: '', message: '' });
      void queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
    onError: () => toast.error('Could not post announcement'),
  });

  const launchPoll = useMutation({
    mutationFn: async () => {
      if (!currentClassroom) {
        throw new Error('No classroom available');
      }
      await createLivePoll({
        classId: currentClassroom.id,
        question: poll.question,
        options: poll.options.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 4),
      });
    },
    onSuccess: () => {
      toast.success('Live poll launched');
      posthog?.capture('teacher_live_poll_created');
      setPoll({ question: '', options: 'Option A\nOption B' });
    },
    onError: () => toast.error('Could not launch poll'),
  });

  if (query.isLoading) {
    return <LoadingSkeleton lines={5} className="min-h-96" />;
  }

  if (query.error || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <WelcomeBanner name={data.user.name} dateLabel={new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Classes overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {data.classrooms.map((classroom) => (
              <div key={classroom.id} className={`rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/60 ${classroom.accent} border-l-4`}>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{classroom.name}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{classroom.subject}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">{classroom.lastActivity}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {[
            { label: 'Present today', value: data.attendance.present, icon: Users2 },
            { label: 'Absent today', value: data.attendance.absent, icon: BellRing },
            { label: 'Student insight', value: data.performance.length, icon: BarChart3 },
          ].map((item) => (
            <Card key={item.label} className="glass-card rounded-[2rem]">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-300">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-50">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={announcement.title} onChange={(event) => setAnnouncement((prev) => ({ ...prev, title: event.target.value }))} placeholder="Announcement title" className="h-11 rounded-2xl" />
            <textarea
              value={announcement.message}
              onChange={(event) => setAnnouncement((prev) => ({ ...prev, message: event.target.value }))}
              placeholder="Share an update with your class"
              className="min-h-32 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/60"
            />
            <Button className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white" onClick={() => postAnnouncement.mutate()}>
              Post announcement
            </Button>
            <div className="space-y-3">
              {data.announcements.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Live polls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={poll.question} onChange={(event) => setPoll((prev) => ({ ...prev, question: event.target.value }))} placeholder="Poll question" className="h-11 rounded-2xl" />
            <textarea
              value={poll.options}
              onChange={(event) => setPoll((prev) => ({ ...prev, options: event.target.value }))}
              placeholder="One option per line"
              className="min-h-32 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/60"
            />
            <Button className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white" onClick={() => launchPoll.mutate()}>
              Launch poll
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Student performance view</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.performance.map((student) => (
              <div key={student.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{student.name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last active {student.lastActive}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${student.engagement === 'HIGH' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : student.engagement === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300' : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'}`}>
                    {student.engagement}
                  </span>
                </div>
                <div className="mt-3 flex gap-6 text-sm text-slate-600 dark:text-slate-300">
                  <span>{student.pdfsRead} PDFs read</span>
                  <span>{student.quizzesTaken} quizzes taken</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Assignment status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-900 dark:text-slate-50">{assignment.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Due {new Date(assignment.dueDate).toLocaleDateString()}</p>
                <div className="mt-3 flex gap-4 text-sm text-slate-600 dark:text-slate-300">
                  <span>Submitted: {assignment.submittedCount || 0}</span>
                  <span>Pending: {assignment.pendingCount || 0}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
