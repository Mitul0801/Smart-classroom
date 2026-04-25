'use client';
import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { CtaButton } from '@/components/cta-button';
import { PageShell } from '@/components/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BrainCircuit, Loader2, AlertCircle, CheckCircle2, GraduationCap, School2 } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const posthog = usePostHog();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

    // Handle query params on mount
    useEffect(() => {
        const requestedRole = searchParams.get('role')?.toUpperCase();
        if (requestedRole === 'TEACHER') setRole('TEACHER');
        if (requestedRole === 'STUDENT') setRole('STUDENT');
    }, [searchParams]);

    async function onGoogleLogin() {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const res = await fetch('/api/auth/firebase', {
                method: 'POST',
                body: JSON.stringify({ idToken, role }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            
            if (res.ok) {
                posthog?.identify(result.user.uid, {
                    email: result.user.email,
                    role,
                    name: result.user.displayName,
                });
                posthog?.capture('login_event', { role });
                toast.success('Logged in successfully!');
                const userRole = data.user.role;
                router.push(userRole === 'TEACHER' ? '/teacher' : '/student');
            } else {
                setError(data.error || 'Login failed. Please try again.');
                toast.error(data.error || 'Login failed');
            }
        } catch (err: unknown) {
            console.error(err);
            const errorCode = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '';
            const msg = errorCode === 'auth/popup-closed-by-user' 
                ? 'Sign-in window was closed.' 
                : 'Google Sign-In failed. Please check your connection.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/40 bg-white/80 shadow-[0_30px_80px_-35px_rgba(79,70,229,0.45)] backdrop-blur-xl lg:grid-cols-2 dark:border-white/10 dark:bg-slate-950/70">
            <div className="relative overflow-hidden bg-linear-to-br from-indigo-700 via-violet-700 to-purple-700 p-8 text-white sm:p-10">
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white/15 p-3">
                            <BrainCircuit className="size-6" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold">SmartClass AI</p>
                            <p className="text-sm text-white/75">AI classroom platform</p>
                        </div>
                    </div>
                    <h1 className="mt-12 text-4xl font-semibold leading-tight">
                        One workspace for guided learning, teaching, and classroom momentum.
                    </h1>
                    <p className="mt-4 max-w-md text-white/80">
                        Sign in once, choose your role, and move from uploaded content to AI-supported teaching in minutes.
                    </p>
                    <div className="mt-10 space-y-4">
                        {[
                            'Upload PDFs and turn them into summaries and quizzes',
                            'Track assignments, attendance, announcements, and polls',
                            'Stay synced across student and teacher dashboards',
                        ].map((item) => (
                            <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3">
                                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-white" />
                                <span className="text-sm text-white/90">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl" />
            </div>

            <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="space-y-3 px-8 pt-8 sm:px-10 sm:pt-10">
                    <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                        {searchParams.get('mode') === 'signup' ? 'Create your account' : 'Welcome back'}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                        Use Google to enter your SmartClass AI workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-8 sm:px-10 sm:pb-10">
                    <div className="rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <button 
                                onClick={() => setRole('STUDENT')}
                                className={`flex items-center justify-center gap-2 rounded-full px-4 py-3 font-medium transition-all ${role === 'STUDENT' ? 'bg-white text-slate-950 shadow-sm dark:bg-indigo-500 dark:text-white' : 'border border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
                            >
                                <GraduationCap className="size-4" />
                                Student
                            </button>
                            <button 
                                onClick={() => setRole('TEACHER')}
                                className={`flex items-center justify-center gap-2 rounded-full px-4 py-3 font-medium transition-all ${role === 'TEACHER' ? 'bg-white text-slate-950 shadow-sm dark:bg-indigo-500 dark:text-white' : 'border border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
                            >
                                <School2 className="size-4" />
                                Teacher
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 animate-in fade-in duration-300 dark:text-red-300">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        </div>
                    )}

                    <CtaButton 
                        disabled={loading} 
                        onClick={onGoogleLogin}
                        className="h-13 w-full justify-center gap-3 rounded-2xl text-base font-semibold"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} className="w-5 h-5 rounded-full bg-white" />
                        )}
                        {loading ? 'Authenticating...' : `Continue as ${role === 'TEACHER' ? 'Teacher' : 'Student'}`}
                    </CtaButton>

                    <p className="text-center text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Secure Google sign-in powered by Firebase Auth
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <PageShell>
            <div className="section-shell flex min-h-screen items-center justify-center py-10">
                <Suspense fallback={<Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />}>
                    <LoginContent />
                </Suspense>
            </div>
        </PageShell>
    );
}
