'use client';

import { ClipboardList, Home, NotebookPen, UploadCloud, Users } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { PageShell } from '@/components/page-shell';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <DashboardNav
        title="Teacher Workspace"
        items={[
          { label: 'Dashboard', href: '/teacher', icon: Home },
          { label: 'Attendance', href: '/teacher/attendance', icon: Users },
          { label: 'Content', href: '/teacher/content', icon: UploadCloud },
          { label: 'Assignments', href: '/teacher/assignments', icon: ClipboardList },
          { label: 'Shared Notes', href: '/teacher/shared-notes', icon: NotebookPen },
        ]}
      >
        {children}
      </DashboardNav>
    </PageShell>
  );
}
