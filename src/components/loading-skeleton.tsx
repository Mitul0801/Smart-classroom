import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoadingSkeleton({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <Card className={`border-white/20 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/5 ${className}`}>
      <CardHeader className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
            style={{ width: `${90 - index * 12}%` }}
          />
        ))}
      </CardContent>
    </Card>
  );
}
