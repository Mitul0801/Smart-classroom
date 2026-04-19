'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        setLoading(false);

        if (res.ok) {
            toast.success('Logged in successfully!');
            router.push(data.role === 'TEACHER' ? '/teacher' : '/student');
        } else {
            toast.error(data.error || 'Login failed');
        }
    }

    return (
        <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <BrainCircuit className="w-6 h-6 text-indigo-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-zinc-50">Welcome Back</CardTitle>
                <CardDescription className="text-center text-zinc-400">
                    Sign in to your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email address</Label>
                        <Input id="email" name="email" type="email" required placeholder="you@example.com" className="bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                        <Input id="password" name="password" type="password" required className="bg-zinc-950/50 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500/50 h-11" />
                    </div>
                    <Button disabled={loading} type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 mt-2">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>
                <div className="mt-6 text-center text-sm text-zinc-400">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        Sign up
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
