'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, MessageSquare, BookOpen, LogOut, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const tabs = [
        { name: 'Dashboard', href: '/student', icon: Home },
        { name: 'Study Assistant', href: '/student/chat', icon: MessageSquare },
        { name: 'Class Notes', href: '/student/notes', icon: BookOpen },
    ];

    async function handleLogout() {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        // #region agent log
        fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'baseline',hypothesisId:'H5',location:'src/app/student/layout.tsx:20',message:'Student logout response status',data:{ok:response.ok,status:response.status},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!response.ok) {
            toast.error("Logout failed");
            return;
        }
        toast.success("Logged out");
        router.push('/');
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col backdrop-blur-xl">
                <div className="p-6 flex items-center gap-2 border-b border-zinc-800">
                    <BrainCircuit className="w-8 h-8 text-indigo-400" />
                    <span className="font-bold text-lg text-white tracking-tight">SmartClass</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {tabs.map((tab) => {
                        const active = pathname === tab.href;
                        return (
                            <Link key={tab.href} href={tab.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'}`}>
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-zinc-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium">
                        <LogOut className="w-5 h-5" />
                        Log out
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-[-20%] left-[20%] w-[40rem] h-[40rem] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
                {children}
            </main>
        </div>
    );
}
