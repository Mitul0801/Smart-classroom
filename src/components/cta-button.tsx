import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CtaButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={cn(
        'rounded-2xl border-0 bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-[0_14px_40px_-18px_rgba(99,102,241,0.95)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_18px_50px_-14px_rgba(147,51,234,0.8)]',
        className,
      )}
    />
  );
}
