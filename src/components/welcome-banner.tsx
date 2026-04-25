import { Card, CardContent } from '@/components/ui/card';

export function WelcomeBanner({
  name,
  dateLabel,
}: {
  name: string;
  dateLabel: string;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Card className="overflow-hidden rounded-[2rem] border-0 bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-[0_24px_60px_-30px_rgba(79,70,229,0.85)]">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/75">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {greeting}, {name} 👋
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Pick up where you left off with AI summaries, new assignments, and class updates.
          </p>
        </div>
        <div className="rounded-3xl bg-white/15 px-4 py-3 text-sm font-medium text-white/90">
          {dateLabel}
        </div>
      </CardContent>
    </Card>
  );
}
