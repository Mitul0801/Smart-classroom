'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ProfileXpCard } from '@/components/profile-xp-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchJson } from '@/lib/api';
import type { ProgressStats } from '@/lib/types';

export default function ProgressPage() {
  const query = useQuery({
    queryKey: ['progress'],
    queryFn: () => fetchJson<{ data: ProgressStats }>('/api/progress').then((res) => res.data),
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
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ProfileXpCard xp={data.xp} nextLevelXp={data.nextLevelXp} badges={data.badges} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['PDFs summarized', data.totalSummaries],
            ['Quizzes attempted', data.totalQuizzes],
            ['Average score', `${data.averageQuizScore}%`],
            ['AI messages sent', data.totalMessages],
          ].map(([label, value]) => (
            <Card key={label} className="glass-card rounded-[2rem]">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Activity donut</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.engagement} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                  {['#4f46e5', '#9333ea', '#06b6d4'].map((color) => (
                    <Cell key={color} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Weekly performance bars</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityBreakdown}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card rounded-[2rem]">
        <CardContent className="flex items-center gap-3 p-6">
          <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-500">
            <Flame className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50">{data.streakDays}-day streak 🔥</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Keep engaging daily to unlock the 7-Day Streak badge.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>How XP is measured</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {data.xpRules.map((rule) => (
            <div key={rule.label} className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">+{rule.xp} XP</p>
              <p className="mt-2 font-medium text-slate-900 dark:text-slate-50">{rule.label}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{rule.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
