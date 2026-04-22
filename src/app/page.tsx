import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, BrainCircuit, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center z-10">
        <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm font-medium text-zinc-300 mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
          Next-Generation Learning Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
          <span className="block text-white">Unlock the future of</span>
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-primary to-violet-400">
            {' '}Education with AI.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed text-balance">
          Empowering teachers to manage classrooms effortlessly, and helping students learn faster 
          with AI-powered summarizations and intelligent chat assistants.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login?mode=signup">
             <Button size="lg" className="h-14 px-8 text-lg bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105 rounded-2xl">
               Get Started for Free
             </Button>
          </Link>
          <Link href="/login?role=teacher">
             <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 transition-all rounded-2xl">
               Teacher Login
             </Button>
          </Link>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-32">
            {[
              { title: 'AI Study Assistant', desc: 'Ask questions, get explanations, and master concepts faster.', icon: BrainCircuit, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
              { title: 'Smart Summaries', desc: 'Upload PDFs and let AI generate concise notes instantly.', icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-400/10' },
              { title: 'Classroom Insights', desc: 'Teachers can track attendance and upload content seamlessly.', icon: GraduationCap, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' }
            ].map((feature, i) => (
              <Card key={i} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl hover:bg-zinc-800/50 transition-colors">
                <CardContent className="p-8 text-left">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg}`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      </main>
    </div>
  );
}
