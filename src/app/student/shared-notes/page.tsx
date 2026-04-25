'use client';

import { useEffect, useState } from 'react';
import { Pin, ThumbsUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import { addSharedNote, subscribeToSharedNotes, upvoteSharedNote } from '@/lib/firebase/services';
import type { DashboardPayload, SharedClassNote } from '@/lib/types';

export default function SharedNotesPage() {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState<SharedClassNote[]>([]);
  const dashboard = useQuery({
    queryKey: ['shared-notes-dashboard'],
    queryFn: () => fetchJson<{ data: DashboardPayload }>('/api/dashboard/student').then((res) => res.data),
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
        <CardTitle>Shared class notes</CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Add short notes for your class, keep them under 500 characters, and upvote the most useful ones.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={text} onChange={(event) => setText(event.target.value.slice(0, 500))} placeholder="Share a key takeaway, mnemonic, or reminder..." className="h-11 rounded-2xl" />
          <Button
            className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white"
            onClick={async () => {
              await addSharedNote(classId, dashboard.data!.user.name, text);
              toast.success('Shared note added');
              setText('');
            }}
          >
            Add note
          </Button>
        </div>
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {note.pinned ? <Pin className="size-4 text-amber-500" /> : null}
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{note.authorName}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{note.text}</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => void upvoteSharedNote(classId, note.id, dashboard.data!.user.id)}
                >
                  <ThumbsUp className="size-4" />
                  {note.upvotes}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
