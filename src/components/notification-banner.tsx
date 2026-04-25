import { BellRing } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Announcement } from '@/lib/types';

export function NotificationBanner({ announcement }: { announcement: Announcement | null }) {
  if (!announcement) {
    return null;
  }

  return (
    <Card className="rounded-[2rem] border-indigo-200 bg-indigo-50/80 dark:border-indigo-500/20 dark:bg-indigo-500/10">
      <CardContent className="flex gap-3 p-5">
        <div className="rounded-2xl bg-indigo-500/15 p-2 text-indigo-600 dark:text-indigo-300">
          <BellRing className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-50">{announcement.title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{announcement.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
