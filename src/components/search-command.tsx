'use client';

import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
import type { SearchHit } from '@/lib/types';

async function fetchSearchHits(): Promise<SearchHit[]> {
  const res = await fetch('/api/search');
  const data = (await res.json()) as { data?: SearchHit[]; error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load search');
  }
  return data.data || [];
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['global-search'],
    queryFn: fetchSearchHits,
    enabled: open,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!data) {
      return [];
    }
    if (!query.trim()) {
      return data.slice(0, 8);
    }
    const fuse = new Fuse(data, {
      keys: ['title', 'content', 'type'],
      threshold: 0.38,
    });
    return fuse.search(query).map((item) => item.item).slice(0, 8);
  }, [data, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden min-w-72 items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-500 backdrop-blur md:flex dark:text-slate-300"
      >
        <Search className="size-4" />
        Search notes, summaries, chats
        <span className="ml-auto rounded-md border border-white/20 px-2 py-0.5 text-xs">⌘K</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-label="Global search"
          className="max-w-2xl rounded-[2rem] border-white/20 bg-white/95 p-0 dark:border-white/10 dark:bg-slate-950"
        >
          <DialogHeader className="border-b border-slate-200 px-6 py-5 dark:border-white/10">
            <DialogTitle>Search SmartClass AI</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5">
            <Input
              autoFocus
              placeholder="Search saved notes, summaries, and chat history..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5"
            />
          </div>
          <div className="max-h-[28rem] overflow-y-auto px-6 pb-6">
            {isLoading ? (
              <div className="space-y-3">
                <LoadingSkeleton lines={2} />
                <LoadingSkeleton lines={2} />
              </div>
            ) : error ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : (
              <div className="space-y-3">
                {results.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    No results found for that search.
                  </div>
                ) : (
                  results.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-900 dark:text-slate-50">{item.title}</p>
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {item.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
