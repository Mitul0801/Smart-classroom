'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { LivePoll } from '@/lib/types';

export function LivePollModal({
  poll,
  open,
  onOpenChange,
  onVote,
}: {
  poll: LivePoll | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVote: (optionId: string) => void;
}) {
  const totalVotes = useMemo(
    () => poll?.options.reduce((sum, option) => sum + option.votes, 0) ?? 0,
    [poll],
  );

  return (
    <Dialog open={open && Boolean(poll)} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label="Live class poll"
        className="max-w-2xl rounded-[2rem] border-white/20 bg-white/95 dark:border-white/10 dark:bg-slate-950"
      >
        <DialogHeader>
          <DialogTitle>{poll?.question || 'Live poll'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {poll?.options.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left"
                onClick={() => onVote(option.id)}
              >
                {option.label}
              </Button>
            ))}
            <p className="text-sm text-slate-500 dark:text-slate-400">{totalVotes} votes submitted live</p>
          </div>
          <div className="h-64 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={poll?.options || []}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Bar dataKey="votes" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
