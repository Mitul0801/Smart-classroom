import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfileXpCard({
  xp,
  nextLevelXp,
  badges,
}: {
  xp: number;
  nextLevelXp: number;
  badges: string[];
}) {
  const progress = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  return (
    <Card className="rounded-[2rem] border-white/40 bg-white/75 dark:border-white/10 dark:bg-white/5">
      <CardHeader>
        <CardTitle>XP & badges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">{xp} XP earned</span>
            <span className="text-slate-500 dark:text-slate-400">{nextLevelXp} next milestone</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-400 via-orange-400 to-rose-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.length > 0 ? (
            badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-300"
              >
                {badge}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No badges yet. Your next summary unlocks one.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
