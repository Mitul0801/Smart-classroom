import { BrowserFrame } from '@/components/browser-frame';
import { CtaButton } from '@/components/cta-button';
import { Navbar } from '@/components/navbar';
import { PageShell } from '@/components/page-shell';
import { buildMetadata } from '@/lib/metadata';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  GraduationCap,
  MessageSquareHeart,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = buildMetadata({
  title: 'SmartClass AI | Smarter classrooms for students and teachers',
  description:
    'Launch AI-assisted classrooms with Google sign-in, classroom dashboards, PDF summaries, analytics, quizzes, assignments, and live polls.',
  keywords: ['AI classroom', 'education platform', 'teacher dashboard', 'student learning', 'Google OAuth'],
  path: '/',
});

export default function Home() {
  return (
    <PageShell className="overflow-hidden">
      <Navbar />
      <main className="section-shell flex flex-col gap-24 py-16 sm:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-8 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
              <Sparkles className="mr-2 size-4" />
              AI-powered classroom workflows for modern schools
            </div>
            <h1 className="max-w-4xl text-5xl font-extrabold leading-tight text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
              Teach faster.
              <br />
              Learn deeper.
              <br />
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Keep every classroom in sync.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              SmartClass AI gives teachers better visibility and gives students a calm, guided learning flow with AI summaries, quizzes, shared notes, polls, and progress insights.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/login?mode=signup">
                <CtaButton size="lg" className="h-14 px-8 text-base">
                  Get Started for Free
                </CtaButton>
              </Link>
              <Link href="/login?role=teacher">
                <CtaButton size="lg" className="h-14 px-8 text-base">
                  Teacher Login
                </CtaButton>
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Summaries in seconds', 'Upload PDFs and get instant AI study guides.'],
                ['Live classroom signals', 'Attendance, announcements, and polls in one place.'],
                ['Built for both roles', 'Students and teachers get tailored dashboards.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/40 bg-white/65 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{title}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <BrowserFrame />
        </section>

        <section className="space-y-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">
              Dashboard preview
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
              A classroom cockpit that feels real from day one
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Students see momentum, teachers see patterns, and both get AI-native tools without jumping across tabs.
            </p>
          </div>
          <BrowserFrame />
        </section>

        <section id="how-it-works" className="space-y-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
              A simple three-step flow for every classroom
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
            {[
              { step: '01', title: 'Sign Up with Google', icon: Sparkles, text: 'Get into the platform in one click with secure Firebase Auth.' },
              { step: '02', title: 'Join or Create a Classroom', icon: UsersRound, text: 'Students join their learning space while teachers set one up quickly.' },
              { step: '03', title: 'Learn & Teach with AI', icon: BrainCircuit, text: 'Generate summaries, run quizzes, post updates, and stay on track.' },
            ].map((item, index) => (
              <div key={item.step} className="contents">
                <Card className="rounded-[2rem] border-white/40 bg-white/75 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-300">
                        <item.icon className="size-5" />
                      </div>
                      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-slate-50">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                  </CardContent>
                </Card>
                {index < 2 ? (
                  <div className="hidden items-center justify-center lg:flex">
                    <div className="flex items-center gap-3 text-indigo-400">
                      <div className="h-px w-12 bg-indigo-300 dark:bg-indigo-500/30" />
                      <ArrowRight className="size-5" />
                      <div className="h-px w-12 bg-indigo-300 dark:bg-indigo-500/30" />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'AI Study Assistant', desc: 'Ask follow-ups, get simpler explanations, and keep chat history searchable.', icon: BrainCircuit, color: 'text-indigo-500' },
              { title: 'Smart Summaries', desc: 'Turn class PDFs into revision notes, MCQs, and saved insights.', icon: BookOpen, color: 'text-violet-500' },
              { title: 'Teacher Control Center', desc: 'Track attendance, assignments, live polls, and announcements at a glance.', icon: GraduationCap, color: 'text-fuchsia-500' }
            ].map((feature) => (
              <Card key={feature.title} className="rounded-[2rem] border-white/40 bg-white/75 shadow-sm dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-8">
                  <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10">
                    <feature.icon className={`size-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">{feature.title}</h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="testimonials" className="space-y-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">
              Testimonials
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
              Trusted by teachers and students who need clarity fast
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { initials: 'AR', name: 'Ava Rodriguez', role: 'Science Teacher', quote: 'SmartClass AI cut my prep time in half and finally gave me a live pulse on student understanding.' },
              { initials: 'MK', name: 'Maya Khan', role: 'High School Student', quote: 'The summary and quiz combo is the first study flow that actually keeps me focused.' },
              { initials: 'JT', name: 'Jordan Tate', role: 'Department Lead', quote: 'Announcements, attendance, and shared notes all feel connected instead of spread across tools.' },
            ].map((person) => (
              <Card key={person.name} className="rounded-[2rem] border-white/40 bg-white/80 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-linear-to-r from-indigo-600 to-purple-600 font-semibold text-white">
                      {person.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">{person.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{person.role}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-slate-600 dark:text-slate-300">&ldquo;{person.quote}&rdquo;</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="rounded-[2rem] border border-white/40 bg-white/75 px-6 py-8 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 font-semibold text-slate-950 dark:text-white">
              <MessageSquareHeart className="size-5 text-indigo-500" />
              SmartClass AI
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">©️ 2025 SmartClass AI</p>
        </footer>
      </main>
    </PageShell>
  );
}
