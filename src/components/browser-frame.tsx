import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, BellRing, BookOpen, Sparkles } from 'lucide-react';

export function BrowserFrame() {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-white/60 bg-white/80 shadow-[0_30px_80px_-30px_rgba(79,70,229,0.45)] dark:border-white/10 dark:bg-slate-950/70">
      <div className="flex items-center gap-2 border-b border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-slate-900/70">
        <span className="size-3 rounded-full bg-rose-400" />
        <span className="size-3 rounded-full bg-amber-400" />
        <span className="size-3 rounded-full bg-emerald-400" />
        <div className="ml-3 flex-1 rounded-full bg-white px-4 py-2 text-xs text-slate-500 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:ring-white/10">
          smartclass.ai/dashboard
        </div>
      </div>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-linear-to-r from-indigo-600 to-purple-600 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Today&apos;s focus</p>
                <h3 className="mt-1 text-2xl font-semibold">Physics Essentials</h3>
              </div>
              <Sparkles className="size-8 text-white/80" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {['AI summary ready', 'Quiz accuracy 88%', '2 announcements'].map((item) => (
                <div key={item} className="rounded-2xl bg-white/15 px-3 py-2 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Summaries', value: '24', icon: BookOpen },
              { label: 'Classrooms', value: '5', icon: BellRing },
              { label: 'Engagement', value: 'High', icon: BarChart3 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <item.icon className="mb-4 size-5 text-indigo-500" />
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Recent activity</p>
            <div className="mt-4 space-y-3">
              {[
                ['Quantum motion summary generated', '12 mins ago'],
                ['Biology classroom joined', '48 mins ago'],
                ['Teacher poll answered', '1 hour ago'],
              ].map(([title, time]) => (
                <div key={title} className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950/70">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
