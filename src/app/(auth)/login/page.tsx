'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BrainCircuit } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

    async function onGoogleLogin() {
        setLoading(true);
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
                // Check the actual role from the DB response
                router.push(data.user.role === 'TEACHER' ? '/teacher' : '/student');
            } else {
                toast.error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Google Sign-In failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl w-full max-w-md mx-auto">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <BrainCircuit className="w-6 h-6 text-indigo-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-zinc-50">Smart Classroom AI</CardTitle>
                <CardDescription className="text-center text-zinc-400">
                    Sign in with your Google account to get started
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex p-1 bg-zinc-950/50 rounded-lg border border-zinc-800 relative z-10">
                    <button 
                        onClick={() => setRole('STUDENT')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'STUDENT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Student
                    </button>
                    <button 
                        onClick={() => setRole('TEACHER')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'TEACHER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Teacher
                    </button>
                </div>

                <Button 
                    disabled={loading} 
                    onClick={onGoogleLogin}
                    className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold shadow-lg transition-all flex items-center justify-center gap-3"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    {loading ? 'Connecting...' : `Sign in as ${role === 'TEACHER' ? 'Teacher' : 'Student'}`}
                </Button>

                <p className="text-center text-xs text-zinc-500 px-4">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </CardContent>
        </Card>
    );
}
