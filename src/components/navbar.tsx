'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Menu, X, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

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
        <nav className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                    <BrainCircuit className="w-6 h-6 text-indigo-400" />
                    SmartClass AI
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <>
                            <Link href={user.role === 'TEACHER' ? '/teacher' : '/student'}>
                                <Button variant="ghost" className="text-zinc-300 hover:text-white flex items-center gap-2">
                                    <User className="w-4 h-4" /> {user.name}
                                </Button>
                            </Link>
                            <Button variant="ghost" onClick={handleLogout} className="text-zinc-400 hover:text-red-400 flex items-center gap-2">
                                <LogOut className="w-4 h-4" /> Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-zinc-300 hover:text-white">Login</Button>
                            </Link>
                            <Link href="/login?mode=signup">
                                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20">Sign Up</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Nav Overlay */}
            {isOpen && (
                <div className="md:hidden border-b border-zinc-800 bg-zinc-950 p-6 space-y-4 animate-in slide-in-from-top duration-200">
                    {user ? (
                        <>
                            <Link href={user.role === 'TEACHER' ? '/teacher' : '/student'} onClick={() => setIsOpen(false)} className="block">
                                <Button variant="ghost" className="w-full text-zinc-300 hover:text-white justify-start">Dashboard</Button>
                            </Link>
                            <Button variant="ghost" onClick={handleLogout} className="w-full text-zinc-400 hover:text-red-400 justify-start">Logout</Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                                <Button variant="ghost" className="w-full text-zinc-300 hover:text-white justify-start">Login</Button>
                            </Link>
                            <Link href="/login?mode=signup" onClick={() => setIsOpen(false)} className="block">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white justify-start">Sign Up</Button>
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
