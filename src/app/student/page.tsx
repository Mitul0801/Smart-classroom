'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceRecord {
    id: string;
    date: string;
    status: string;
}

export default function StudentDashboard() {
    const [attHistory, setAttHistory] = useState<AttendanceRecord[]>([]);

    async function fetchAttendanceHistory() {
        const res = await fetch('/api/attendance');
        // #region agent log
        fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'baseline',hypothesisId:'H2',location:'src/app/student/page.tsx:21',message:'Attendance history response status',data:{ok:res.ok,status:res.status},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!res.ok) throw new Error("Failed to fetch history");
        const payload = await res.json();
        return payload.data || [];
    }

    useEffect(() => {
        let isActive = true;
        fetchAttendanceHistory()
            .then(history => {
                if (isActive) {
                    setAttHistory(history);
                }
            })
            .catch(() => toast.error("Could not load attendance history"));
        return () => {
            isActive = false;
        };
    }, []);

    async function markAttendance() {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            body: JSON.stringify({ status: 'PRESENT' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        // #region agent log
        fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'baseline',hypothesisId:'H1',location:'src/app/student/page.tsx:35',message:'Attendance mark response payload shape',data:{ok:res.ok,status:res.status,hasData:Boolean(data?.data),keys:data?Object.keys(data):[]},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (res.ok) {
            toast.success("Attendance marked as requested!");
            const history = await fetchAttendanceHistory();
            setAttHistory(history);
        } else {
            toast.error(data.error || "Could not mark attendance");
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto z-10 relative">
            <h1 className="text-3xl font-bold mb-8 items-center flex gap-3 text-white">
                Dashboard Overview
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-zinc-300 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-400" /> Mark Today&apos;s Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={markAttendance} className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20">
                            I am Present
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mb-4 text-zinc-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> Attendance History
            </h2>
            <Card className="bg-zinc-900/40 border-zinc-800/50">
                <div className="divide-y divide-zinc-800">
                    {attHistory.length === 0 ? (
                        <div className="p-6 text-zinc-400 text-center">No attendance history found.</div>
                    ) : (
                        attHistory.map(record => (
                            <div key={record.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                                <span className="text-zinc-300">{new Date(record.date).toLocaleDateString()}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {record.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
