'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!isClient || !posthogKey || posthog.__loaded) {
      return;
    }

    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: 'identified_only',
    });
  }, [isClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="smartclass-theme">
      <QueryClientProvider client={queryClient}>
        {posthogKey && isClient ? <PostHogProvider client={posthog}>{children}</PostHogProvider> : children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
