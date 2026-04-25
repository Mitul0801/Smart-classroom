import { cn } from '@/lib/utils';

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_28%)]',
        className,
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(248,250,252,1))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.84),rgba(2,6,23,1))]" />
      {children}
    </div>
  );
}
