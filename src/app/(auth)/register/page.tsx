'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('STUDENT');

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        setLoading(false);

        if (res.ok) {
            toast.success('Account created! Please log in.');
            router.push('/login');
        } else {
            toast.error(data.error || 'Registration failed');
        }
    }

    return (
        <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <BrainCircuit className="w-6 h-6 text-violet-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-zinc-50">Create an Account</CardTitle>
                <CardDescription className="text-center text-zinc-400">
                    Get started with SmartClass AI
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={role} onValueChange={setRole} className="mb-6">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-950/50 border border-zinc-800 p-1 rounded-xl">
                        <TabsTrigger value="STUDENT" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Student</TabsTrigger>
                        <TabsTrigger value="TEACHER" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Teacher</TabsTrigger>
                    </TabsList>
                </Tabs>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                        <Input id="name" name="name" required placeholder="John Doe" className="bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email address</Label>
                        <Input id="email" name="email" type="email" required placeholder="you@example.com" className="bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                        <Input id="password" name="password" type="password" required className="bg-zinc-950/50 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500/50 h-11" />
                    </div>
                    <Button disabled={loading} type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 mt-2">
                        {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                </form>
                <div className="mt-6 text-center text-sm text-zinc-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        Sign in
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
