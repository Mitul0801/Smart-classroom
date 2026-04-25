'use client';

import { useEffect, useState } from 'react';
import { Pin, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import { deleteSharedNote, subscribeToSharedNotes, updateSharedNotePin } from '@/lib/firebase/services';
import type { SharedClassNote } from '@/lib/types';

export default function TeacherSharedNotesPage() {
  const [notes, setNotes] = useState<SharedClassNote[]>([]);
  const dashboard = useQuery({
    queryKey: ['teacher-shared-notes-dashboard'],
    queryFn: () => fetchJson<{ data: { classrooms: Array<{ id: string }> } }>('/api/dashboard/teacher').then((res) => res.data),
  });

  useEffect(() => {
    const classId = dashboard.data?.classrooms[0]?.id;
    if (!classId) {
      return;
    }
    return subscribeToSharedNotes(classId, setNotes);
  }, [dashboard.data?.classrooms]);

  if (dashboard.isLoading) {
    return <LoadingSkeleton lines={5} className="min-h-96" />;
  }

  if (dashboard.error || !dashboard.data) {
    return <ErrorState onRetry={() => void dashboard.refetch()} />;
  }

  const classId = dashboard.data.classrooms[0]?.id || 'class-physics';

  return (
    <Card className="glass-card rounded-[2rem]">
      <CardHeader>
        <CardTitle>Moderate shared class notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{note.authorName}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{note.text}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => void updateSharedNotePin(classId, note.id, !note.pinned)}>
                  <Pin className="size-4" />
                  {note.pinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => void deleteSharedNote(classId, note.id)}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
