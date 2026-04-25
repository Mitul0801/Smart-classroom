'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/error-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchJson } from '@/lib/api';
import type { AttendanceStats } from '@/lib/types';

export default function TeacherAttendance() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const query = useQuery({
    queryKey: ['attendance', dateFilter],
    queryFn: () =>
      fetchJson<{ data: AttendanceStats }>(`/api/attendance?date=${dateFilter}`).then((res) => res.data),
    refetchInterval: 15000,
  });

  const pieData = useMemo(
    () =>
      query.data
        ? [
            { name: 'Present', value: query.data.present },
            { name: 'Absent', value: query.data.absent },
          ]
        : [],
    [query.data],
  );

  if (query.isLoading) {
    return <LoadingSkeleton lines={5} className="min-h-96" />;
  }

  if (query.error || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card rounded-[2rem]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Attendance analytics</CardTitle>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Present vs absent snapshot, weekly trend, and export-ready records.
            </p>
          </div>
          <div className="flex gap-3">
            <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-11 rounded-2xl" />
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                const csv = ['Student,Email,Status,Date', ...query.data.records.map((record) => `${record.studentName},${record.studentEmail},${record.status},${record.date}`)].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `attendance-${dateFilter}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Present vs absent</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-[2rem]">
          <CardHeader>
            <CardTitle>Weekly trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={query.data.weeklyTrend}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="present" fill="#4f46e5" radius={[10, 10, 0, 0]} />
                <Bar dataKey="absent" fill="#f43f5e" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>Daily records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {query.data.records.map((record) => (
            <div key={record.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{record.studentName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{record.studentEmail}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${record.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'}`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
