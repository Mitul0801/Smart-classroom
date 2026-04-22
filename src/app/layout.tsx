import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'SmartClass AI – AI-Powered Classroom Platform',
  description: 'Empowering teachers and students with AI-powered summaries, chat assistants, and classroom management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
