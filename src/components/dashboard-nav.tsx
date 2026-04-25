'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrainCircuit, LogOut, Menu } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SearchCommand } from '@/components/search-command';
import { cn } from '@/lib/utils';

const ThemeToggle = dynamic(
  () => import('@/components/theme-toggle').then((mod) => mod.ThemeToggle),
  { ssr: false },
);

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardNav({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) {
      toast.error('Logout failed');
      return;
    }
    toast.success('Logged out');
    router.push('/');
    router.refresh();
  }

  const links = (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
              active
                ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10',
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:flex lg:flex-col">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 p-2 text-white">
              <BrainCircuit className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">SmartClass AI</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 pb-6">{links}</div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 p-2 text-white">
                <BrainCircuit className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">SmartClass AI</p>
              </div>
            </div>

            <div className="ml-auto hidden items-center gap-3 lg:flex">
              <SearchCommand />
              <ThemeToggle />
              <Button variant="outline" className="rounded-full" onClick={() => void logout()}>
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <Sheet>
                <SheetTrigger
                  aria-label="Open dashboard menu"
                  className="rounded-full border border-white/20 bg-white/10 p-2 dark:bg-white/5"
                >
                  <Menu className="size-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-[88vw] max-w-sm border-white/10 bg-white dark:bg-slate-950">
                  <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-4">
                    <div className="mb-4">
                      <SearchCommand />
                    </div>
                    {links}
                    <Button variant="outline" className="mt-4 w-full rounded-2xl" onClick={() => void logout()}>
                      <LogOut className="size-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="section-shell py-6 sm:py-8">{children}</div>
      </div>
    </div>
  );
}
