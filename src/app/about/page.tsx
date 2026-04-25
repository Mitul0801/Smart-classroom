import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'About | SmartClass AI',
  description: 'Learn about SmartClass AI and how it supports students and teachers with AI-powered classroom tools.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <main className="section-shell py-20">
      <h1 className="text-4xl font-semibold">About SmartClass AI</h1>
      <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-300">
        SmartClass AI is built to make classroom workflows feel lighter, clearer, and more responsive for both students and teachers.
      </p>
    </main>
  );
}
