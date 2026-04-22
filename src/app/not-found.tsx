import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="z-10 flex flex-col items-center max-w-md w-full">
                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-8 border border-indigo-500/20">
                    <BrainCircuit className="w-10 h-10 text-indigo-400" />
                </div>
                
                <h1 className="text-8xl font-black text-white mb-4 tracking-tighter">404</h1>
                <h2 className="text-2xl font-bold text-zinc-100 mb-6">Page Not Found</h2>
                
                <p className="text-zinc-400 mb-10 leading-relaxed text-balance">
                    Oops! It seems you&apos;ve taken a wrong turn. The classroom you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                
                <Link href="/" className="w-full">
                    <Button size="lg" className="h-14 w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl gap-2 font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
                        <Home className="w-5 h-5" />
                        Back to Home
                    </Button>
                </Link>
            </div>

            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        </div>
    );
}
