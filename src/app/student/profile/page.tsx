'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ProfileXpCard } from '@/components/profile-xp-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchJson } from '@/lib/api';
import type { DashboardPayload, ProgressStats } from '@/lib/types';

export default function StudentProfilePage() {
  const dashboard = useQuery({
    queryKey: ['profile-dashboard'],
    queryFn: () => fetchJson<{ data: DashboardPayload }>('/api/dashboard/student').then((res) => res.data),
  });
  const progress = useQuery({
    queryKey: ['profile-progress'],
    queryFn: () => fetchJson<{ data: ProgressStats }>('/api/progress').then((res) => res.data),
  });

  if (dashboard.isLoading || progress.isLoading) {
    return <LoadingSkeleton lines={5} className="min-h-96" />;
  }

  if (dashboard.error || progress.error || !dashboard.data || !progress.data) {
    return <ErrorState onRetry={() => { void dashboard.refetch(); void progress.refetch(); }} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>{dashboard.data.user.name}</CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-300">{dashboard.data.user.email}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">Student</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Days active</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{progress.data.streakDays} 🔥</p>
          </div>
        </CardContent>
      </Card>
      <ProfileXpCard xp={progress.data.xp} nextLevelXp={progress.data.nextLevelXp} badges={progress.data.badges} />
    </div>
  );
}
