export type UserRole = 'STUDENT' | 'TEACHER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
}

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  teacherName: string;
  teacherId: string;
  accent: string;
  lastActivity: string;
  announcementCount: number;
}

export interface SummaryRecord {
  id: string;
  title: string;
  sourceType: 'NOTE' | 'PDF';
  content: string;
  createdAt: string;
  classroomId: string;
}

export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  bookmarked?: boolean;
}

export interface SavedNote {
  id: string;
  content: string;
  source: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  classId: string;
  className: string;
  dueDate: string;
  status: 'PENDING' | 'DONE';
  overdue: boolean;
  submittedCount?: number;
  pendingCount?: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  classId: string;
}

export interface SharedClassNote {
  id: string;
  authorName: string;
  text: string;
  upvotes: number;
  pinned: boolean;
  createdAt: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface LivePoll {
  id: string;
  question: string;
  classId: string;
  active: boolean;
  options: PollOption[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export interface QuizAttempt {
  id: string;
  summaryId: string;
  score: number;
  total: number;
  completedAt: string;
}

export interface ProgressStats {
  totalSummaries: number;
  totalQuizzes: number;
  averageQuizScore: number;
  totalMessages: number;
  streakDays: number;
  xp: number;
  nextLevelXp: number;
  badges: string[];
  engagement: Array<{ name: string; value: number }>;
  activityBreakdown: Array<{ name: string; value: number }>;
  xpRules: Array<{
    label: string;
    xp: number;
    description: string;
  }>;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  weeklyTrend: Array<{ day: string; present: number; absent: number }>;
  records: Array<{
    id: string;
    studentName: string;
    studentEmail: string;
    status: 'PRESENT' | 'ABSENT';
    date: string;
  }>;
}

export interface StudentPerformance {
  id: string;
  name: string;
  lastActive: string;
  pdfsRead: number;
  quizzesTaken: number;
  engagement: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SearchHit {
  id: string;
  type: 'note' | 'summary' | 'chat';
  title: string;
  content: string;
  createdAt: string;
}

export interface DashboardPayload {
  user: AuthUser;
  dateLabel: string;
  classrooms: Classroom[];
  announcements: Announcement[];
  assignments: Assignment[];
  recentSummaries: SummaryRecord[];
  savedNotes: SavedNote[];
  progress: ProgressStats;
}
