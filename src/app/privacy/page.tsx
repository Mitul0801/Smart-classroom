import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Privacy Policy | SmartClass AI',
  description: 'Read the SmartClass AI privacy policy.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <main className="section-shell py-20">
      <h1 className="text-4xl font-semibold">Privacy Policy</h1>
      <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-300">
        SmartClass AI stores classroom activity and account details only to provide the learning experience, analytics, and collaboration tools requested by your school community.
      </p>
    </main>
  );
}
