'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Menu, X, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { SearchCommand } from '@/components/search-command';
import { CtaButton } from '@/components/cta-button';
import { Button } from '@/components/ui/button';

const ThemeToggle = dynamic(
    () => import('@/components/theme-toggle').then((mod) => mod.ThemeToggle),
    { ssr: false },
);

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<{ name: string; role: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser(data.user);
                }
            })
            .catch(() => {});
    }, []);

    const handleLogout = async () => {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
            setUser(null);
            toast.success("Logged out successfully");
            router.push('/');
            router.refresh();
        }
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <div className="section-shell flex h-18 items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
                    <span className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 p-2 text-white">
                        <BrainCircuit className="w-5 h-5" />
                    </span>
                    SmartClass AI
                </Link>

                <div className="hidden items-center gap-4 lg:flex">
                    <Link href="/#how-it-works" className="text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">How It Works</Link>
                    <Link href="/#testimonials" className="text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">Testimonials</Link>
                    <SearchCommand />
                    <ThemeToggle />
                    {user ? (
                        <>
                            <Link href={user.role === 'TEACHER' ? '/teacher' : '/student'}>
                                <Button variant="ghost" className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white flex items-center gap-2">
                                    <User className="w-4 h-4" /> {user.name}
                                </Button>
                            </Link>
                            <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-300 flex items-center gap-2">
                                <LogOut className="w-4 h-4" /> Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">Login</Button>
                            </Link>
                            <Link href="/login?mode=signup">
                                <CtaButton>Sign Up</CtaButton>
                            </Link>
                        </>
                    )}
                </div>

                <button 
                    className="lg:hidden rounded-full border border-white/20 bg-white/10 p-2 text-slate-500 transition-colors hover:text-slate-950 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {isOpen && (
                <div className="lg:hidden border-b border-slate-200 bg-white p-6 space-y-4 animate-in slide-in-from-top duration-200 dark:border-white/10 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                    </div>
                    {user ? (
                        <>
                            <Link href={user.role === 'TEACHER' ? '/teacher' : '/student'} onClick={() => setIsOpen(false)} className="block">
                                <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                            </Link>
                            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-rose-500">Logout</Button>
                        </>
                    ) : (
                        <>
                            <Link href="/#how-it-works" onClick={() => setIsOpen(false)} className="block">
                                <Button variant="ghost" className="w-full justify-start">How It Works</Button>
                            </Link>
                            <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                                <Button variant="ghost" className="w-full justify-start">Login</Button>
                            </Link>
                            <Link href="/login?mode=signup" onClick={() => setIsOpen(false)} className="block">
                                <CtaButton className="w-full justify-start">Sign Up</CtaButton>
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
