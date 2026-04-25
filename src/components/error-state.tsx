'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ErrorState({
  onRetry,
  message = 'Something went wrong. Try again.',
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <Card className="border-rose-200/70 bg-rose-50/80 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-rose-500/15 p-2 text-rose-600 dark:text-rose-300">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50">{message}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              We couldn&apos;t load this section right now.
            </p>
          </div>
        </div>
        {onRetry ? (
          <Button type="button" variant="outline" className="gap-2" onClick={onRetry}>
            <RefreshCcw className="size-4" />
            Retry
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
