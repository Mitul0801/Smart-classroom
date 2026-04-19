'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Users, UploadCloud } from "lucide-react";
import Link from 'next/link';

export default function TeacherDashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto z-10 relative">
      <h1 className="text-3xl font-bold mb-8 items-center flex gap-3 text-white">
          Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/teacher/attendance">
              <Card className="bg-zinc-900/40 border-zinc-800/50 hover:border-fuchsia-500/50 transition-all hover:bg-zinc-800/60 cursor-pointer h-full group">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Users className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Track Attendance</h3>
                      <p className="text-zinc-400">View daily student presence</p>
                  </CardContent>
              </Card>
          </Link>
          <Link href="/teacher/content">
              <Card className="bg-zinc-900/40 border-zinc-800/50 hover:border-indigo-500/50 transition-all hover:bg-zinc-800/60 cursor-pointer h-full group">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Upload Material</h3>
                      <p className="text-zinc-400">Distribute notes & PDFs</p>
                  </CardContent>
              </Card>
          </Link>
      </div>
    </div>
  );
}
