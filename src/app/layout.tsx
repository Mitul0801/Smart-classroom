import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';
import { PostHogPageview } from '@/components/posthog-pageview';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'SmartClass AI | AI-Powered Classroom Platform',
  description:
    'SmartClass AI helps teachers and students manage classrooms, summarize PDFs, chat with AI, track progress, and stay aligned.',
  keywords: [
    'SmartClass AI',
    'AI classroom platform',
    'student dashboard',
    'teacher analytics',
    'Next.js education app',
  ],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
