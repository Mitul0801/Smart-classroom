'use client';
import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BrainCircuit, Loader2, AlertCircle } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
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
                toast.success('Logged in successfully!');
                // Precise routing based on role
                const userRole = data.user.role;
                if (!userRole) {
                    router.push('/onboarding');
                } else {
                    router.push(userRole === 'TEACHER' ? '/teacher' : '/student');
                }
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
        <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl w-full max-w-md mx-auto sm:border md:rounded-3xl">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <BrainCircuit className="w-6 h-6 text-indigo-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-zinc-50">
                    {searchParams.get('mode') === 'signup' ? 'Create your Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-center text-zinc-400">
                    Sign in with Google to access your smart classroom
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex p-1 bg-zinc-950/50 rounded-lg border border-zinc-800 relative z-10 text-sm">
                    <button 
                        onClick={() => setRole('STUDENT')}
                        className={`flex-1 py-2 font-medium rounded-md transition-all ${role === 'STUDENT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Student
                    </button>
                    <button 
                        onClick={() => setRole('TEACHER')}
                        className={`flex-1 py-2 font-medium rounded-md transition-all ${role === 'TEACHER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Teacher
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-3 text-sm animate-in fade-in duration-300">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <Button 
                    disabled={loading} 
                    onClick={onGoogleLogin}
                    className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 font-bold shadow-lg transition-all flex items-center justify-center gap-3 rounded-xl"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} className="w-5 h-5" />
                    )}
                    {loading ? 'Authenticating...' : `Sign in as ${role === 'TEACHER' ? 'Teacher' : 'Student'}`}
                </Button>

                <p className="text-center text-[10px] text-zinc-500 px-4 uppercase tracking-widest">
                    Secure Cloud Encryption Enabled
                </p>
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative">
             <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
             
             <Suspense fallback={<Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />}>
                <LoginContent />
             </Suspense>
        </div>
    );
}
