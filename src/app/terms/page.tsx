import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Terms of Service | SmartClass AI',
  description: 'Read the SmartClass AI terms of service.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <main className="section-shell py-20">
      <h1 className="text-4xl font-semibold">Terms of Service</h1>
      <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-300">
        By using SmartClass AI, you agree to use the platform for legitimate educational workflows and to respect your school&apos;s classroom and privacy policies.
      </p>
    </main>
  );
}
