'use client';

import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = resolvedTheme !== undefined;
  const dark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
  const label = !mounted ? 'Toggle theme' : dark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      className="rounded-full border-white/20 bg-white/10 text-foreground backdrop-blur-sm hover:bg-white/20 dark:border-white/10 dark:bg-white/5"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {!mounted ? (
        <span className="size-4 rounded-full border border-current opacity-70" aria-hidden="true" />
      ) : dark ? (
        <SunMedium className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
