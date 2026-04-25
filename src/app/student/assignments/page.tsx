'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import type { Assignment } from '@/lib/types';

export default function StudentAssignmentsPage() {
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => fetchJson<{ data: Assignment[] }>('/api/assignments').then((res) => res.data),
  });

  const update = useMutation({
    mutationFn: (assignment: Assignment) =>
      fetchJson<{ success: boolean }>('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          status: assignment.status === 'DONE' ? 'PENDING' : 'DONE',
        }),
      }),
    onSuccess: () => {
      toast.success('Assignment updated');
      void queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });

  const assignments = useMemo(() => {
    const items = [...(query.data || [])];
    items.sort((a, b) =>
      sort === 'asc'
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    );
    return items;
  }, [query.data, sort]);

  if (query.isLoading) {
    return <LoadingSkeleton lines={5} className="min-h-96" />;
  }

  if (query.error) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  return (
    <Card className="glass-card rounded-[2rem]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assignment tracker</CardTitle>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Track upcoming work, sort by due date, and mark progress as you go.
          </p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}>
          Sort by due date
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`rounded-[1.5rem] border p-5 ${assignment.overdue ? 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/60'}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{assignment.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {assignment.subject} • Due {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{assignment.description}</p>
              </div>
              <Button
                variant={assignment.status === 'DONE' ? 'secondary' : 'outline'}
                className="rounded-full"
                onClick={() => update.mutate(assignment)}
              >
                {assignment.status === 'DONE' ? 'Done' : 'Pending'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
