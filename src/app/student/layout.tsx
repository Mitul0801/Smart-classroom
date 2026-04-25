'use client';

import { BarChart3, BookOpen, ClipboardList, Gamepad2, Home, MessageSquare, NotebookPen, UserRound, UsersRound } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { PageShell } from '@/components/page-shell';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <DashboardNav
        title="Student Workspace"
        items={[
          { label: 'Dashboard', href: '/student', icon: Home },
          { label: 'Study Assistant', href: '/student/chat', icon: MessageSquare },
          { label: 'Class Content', href: '/student/notes', icon: BookOpen },
          { label: 'Quiz Games', href: '/student/games', icon: Gamepad2 },
          { label: 'Assignments', href: '/student/assignments', icon: ClipboardList },
          { label: 'Progress', href: '/student/progress', icon: BarChart3 },
          { label: 'Shared Notes', href: '/student/shared-notes', icon: UsersRound },
          { label: 'My Notes', href: '/student/my-notes', icon: NotebookPen },
          { label: 'Profile', href: '/student/profile', icon: UserRound },
        ]}
      >
        {children}
      </DashboardNav>
    </PageShell>
  );
}
