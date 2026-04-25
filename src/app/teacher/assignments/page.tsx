'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import type { Assignment } from '@/lib/types';

export default function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    classId: 'class-physics',
    className: 'Physics Essentials',
    subject: 'Physics',
  });

  const query = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => fetchJson<{ data: Assignment[] }>('/api/assignments').then((res) => res.data),
  });

  const create = useMutation({
    mutationFn: () =>
      fetchJson<{ success: boolean }>('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      toast.success('Assignment created');
      setForm({
        title: '',
        description: '',
        dueDate: '',
        classId: 'class-physics',
        className: 'Physics Essentials',
        subject: 'Physics',
      });
      void queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });

  if (query.isLoading) {
    return <LoadingSkeleton lines={5} className="min-h-96" />;
  }

  if (query.error) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>Create assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Assignment title" className="h-11 rounded-2xl" />
          <Input value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} placeholder="Subject" className="h-11 rounded-2xl" />
          <Input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} className="h-11 rounded-2xl" />
          <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Assignment description" className="min-h-40 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/60" />
          <Button className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white" onClick={() => create.mutate()}>
            Create assignment
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>Submitted vs pending students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.data?.map((assignment) => (
            <div key={assignment.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
              <p className="font-semibold text-slate-900 dark:text-slate-50">{assignment.title}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {assignment.subject} • Due {new Date(assignment.dueDate).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-6 text-sm text-slate-600 dark:text-slate-300">
                <span>Submitted: {assignment.submittedCount || 0}</span>
                <span>Pending: {assignment.pendingCount || 0}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
