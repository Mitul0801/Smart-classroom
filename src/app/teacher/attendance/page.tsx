'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Filter } from "lucide-react";
import { Input } from '@/components/ui/input';

interface AttendanceRecord {
    id: string;
    student: { name: string; email: string };
    status: string;
}

export default function TeacherAttendance() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        async function fetchRecords(date: string) {
            const res = await fetch(`/api/attendance?date=${date}`);
            const data = await res.json();
            setRecords(data.data || []);
        }
        fetchRecords(dateFilter);
    }, [dateFilter]);

    return (
        <div className="p-8 max-w-5xl mx-auto z-10 relative">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold items-center flex gap-3 text-white">
                    <Users className="text-fuchsia-400 w-8 h-8" /> Student Attendance
                </h1>
                <div className="flex items-center gap-2">
                    <Filter className="text-zinc-400 w-5 h-5" />
                    <Input 
                        type="date" 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value)} 
                        className="bg-zinc-900 border-zinc-700 text-zinc-100" 
                    />
                </div>
            </div>

            <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md">
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-800">
                        {records.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">No attendance records found for this date.</div>
                        ) : (
                            records.map(record => (
                                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20">
                                    <div>
                                        <p className="font-semibold text-zinc-200">{record.student.name}</p>
                                        <p className="text-xs text-zinc-400">{record.student.email}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {record.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
