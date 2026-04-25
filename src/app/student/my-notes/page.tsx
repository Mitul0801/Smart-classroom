'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import type { SavedNote } from '@/lib/types';

export default function MyNotesPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['my-notes'],
    queryFn: () => fetchJson<{ data: SavedNote[] }>('/api/bookmarks').then((res) => res.data),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/bookmarks?id=${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Note deleted');
      void queryClient.invalidateQueries({ queryKey: ['my-notes'] });
    },
  });

  const filtered = useMemo(
    () =>
      (query.data || []).filter((note) =>
        `${note.source} ${note.content}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data, search],
  );

  if (query.isLoading) {
    return <LoadingSkeleton lines={5} className="min-h-96" />;
  }

  if (query.error) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  return (
    <Card className="glass-card rounded-[2rem]">
      <CardHeader>
        <CardTitle>My Notes</CardTitle>
        <div className="relative mt-4 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search saved notes..." className="h-11 rounded-2xl pl-10" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filtered.map((note) => (
          <div key={note.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-slate-950/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{note.source}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="icon" className="rounded-full" onClick={() => remove.mutate(note.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{note.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
