import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Contact | SmartClass AI',
  description: 'Contact SmartClass AI for product questions, support, or partnership opportunities.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <main className="section-shell py-20">
      <h1 className="text-4xl font-semibold">Contact</h1>
      <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-300">
        Reach the SmartClass AI team at support@smartclass.ai for platform help, school onboarding, or feedback.
      </p>
    </main>
  );
}
