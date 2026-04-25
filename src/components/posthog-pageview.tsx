'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) {
      return;
    }

    const query = searchParams.toString();
    posthog.capture('$pageview', {
      $current_url: query ? `${pathname}?${query}` : pathname,
    });
  }, [pathname, posthog, searchParams]);

  return null;
}
