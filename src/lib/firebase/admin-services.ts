import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import type {
  Announcement,
  Assignment,
  AttendanceStats,
  AuthUser,
  ChatMessageRecord,
  Classroom,
  DashboardPayload,
  ProgressStats,
  QuizAttempt,
  SavedNote,
  SearchHit,
  StudentPerformance,
  SummaryRecord,
  UserRole,
} from '@/lib/types';

function serializeDate(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const fallbackClassrooms: Classroom[] = [
  {
    id: 'class-physics',
    name: 'Physics Essentials',
    subject: 'Physics',
    teacherName: 'Ava Patel',
    teacherId: 'teacher-1',
    accent: 'border-l-sky-500',
    lastActivity: 'Updated 45 minutes ago',
    announcementCount: 1,
  },
  {
    id: 'class-biology',
    name: 'Biology Lab',
    subject: 'Biology',
    teacherName: 'Marcus Reed',
    teacherId: 'teacher-2',
    accent: 'border-l-emerald-500',
    lastActivity: 'New worksheet 2 hours ago',
    announcementCount: 2,
  },
  {
    id: 'class-history',
    name: 'World History',
    subject: 'History',
    teacherName: 'Nina Costa',
    teacherId: 'teacher-3',
    accent: 'border-l-amber-500',
    lastActivity: 'Discussion prompt yesterday',
    announcementCount: 0,
  },
];

async function getUserProfile(userId: string): Promise<AuthUser> {
  const snapshot = await adminDb.collection('users').doc(userId).get();
  const data = snapshot.data();
  const name = String(data?.name || 'SmartClass User');
  const role = (data?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT') as UserRole;

  return {
    id: userId,
    name,
    email: String(data?.email || 'unknown@smartclass.ai'),
    role,
    avatarInitials: initialsFromName(name),
  };
}

export async function ensureUserDocument(params: {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}): Promise<AuthUser> {
  const userRef = adminDb.collection('users').doc(params.uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set({
      name: params.name,
      email: params.email,
      role: params.role,
      createdAt: new Date(),
      streakDays: 1,
      xp: 0,
      badges: [],
    });
  } else {
    await userRef.set(
      {
        name: params.name,
        email: params.email,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  }

  return getUserProfile(params.uid);
}

export async function getUserDocument(userId: string): Promise<AuthUser> {
  return getUserProfile(userId);
}

export async function listClassrooms(): Promise<Classroom[]> {
  const snapshot = await adminDb.collection('classrooms').limit(20).get();
  if (snapshot.empty) {
    return fallbackClassrooms;
  }

  const accentTokens = [
    'border-l-sky-500',
    'border-l-fuchsia-500',
    'border-l-emerald-500',
    'border-l-amber-500',
    'border-l-cyan-500',
  ];

  return snapshot.docs.map((item, index) => {
    const data = item.data();
    return {
      id: item.id,
      name: String(data.name || data.subject || `Class ${index + 1}`),
      subject: String(data.subject || 'General'),
      teacherName: String(data.teacherName || 'SmartClass Teacher'),
      teacherId: String(data.teacherId || `teacher-${index + 1}`),
      accent: accentTokens[index % accentTokens.length],
      lastActivity: String(data.lastActivity || 'Updated recently'),
      announcementCount: Number(data.announcementCount || 0),
    };
  });
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const classes = await listClassrooms();
  const queries = await Promise.all(
    classes.map(async (classroom) => {
      const snapshot = await adminDb
        .collection('classrooms')
        .doc(classroom.id)
        .collection('announcements')
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get()
        .catch(() => null);

      if (!snapshot || snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((item) => ({
        id: item.id,
        title: String(item.data().title || 'Announcement'),
        message: String(item.data().message || ''),
        classId: classroom.id,
        createdAt: serializeDate(item.data().createdAt),
      }));
    }),
  );

  const flattened = queries.flat();
  if (flattened.length > 0) {
    return flattened.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  }

  return [
    {
      id: 'announcement-1',
      title: 'New revision pack uploaded',
      message: 'Your teacher added a concept map and practice sheet for tomorrow.',
      classId: classes[0]?.id || 'class-physics',
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function listAssignments(userId: string, role: UserRole): Promise<Assignment[]> {
  const snapshot = await adminDb.collection('assignments').orderBy('dueDate', 'asc').limit(25).get().catch(() => null);

  const assignments = snapshot?.docs.map((item) => {
    const data = item.data();
    const dueDate = serializeDate(data.dueDate);
    return {
      id: item.id,
      title: String(data.title || 'Untitled assignment'),
      description: String(data.description || ''),
      subject: String(data.subject || 'General'),
      classId: String(data.classId || 'class-physics'),
      className: String(data.className || 'General Studies'),
      dueDate,
      status: role === 'STUDENT' ? (data.status === 'DONE' ? 'DONE' : 'PENDING') : 'PENDING',
      overdue: new Date(dueDate).getTime() < Date.now() && data.status !== 'DONE',
      submittedCount: Number(data.submittedCount || 0),
      pendingCount: Number(data.pendingCount || 0),
    } satisfies Assignment;
  }) || [];

  if (assignments.length > 0) {
    return assignments;
  }

  return [
    {
      id: 'assignment-1',
      title: 'Newton Laws Reflection',
      description: 'Write a short summary and solve two application problems.',
      subject: 'Physics',
      classId: 'class-physics',
      className: 'Physics Essentials',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      status: role === 'STUDENT' ? 'PENDING' : 'PENDING',
      overdue: false,
      submittedCount: 18,
      pendingCount: 7,
    },
    {
      id: 'assignment-2',
      title: 'Cell Structure Flashcards',
      description: 'Create 10 flashcards covering organelles and functions.',
      subject: 'Biology',
      classId: 'class-biology',
      className: 'Biology Lab',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      status: role === 'STUDENT' ? 'PENDING' : 'PENDING',
      overdue: true,
      submittedCount: 21,
      pendingCount: 4,
    },
  ];
}

export async function upsertAssignmentSubmission(params: {
  userId: string;
  assignmentId: string;
  status: 'PENDING' | 'DONE';
}): Promise<void> {
  await adminDb
    .collection('users')
    .doc(params.userId)
    .collection('assignments')
    .doc(params.assignmentId)
    .set(
      {
        status: params.status,
        updatedAt: new Date(),
      },
      { merge: true },
    );
}

export async function createAssignment(params: {
  title: string;
  description: string;
  dueDate: string;
  classId: string;
  className: string;
  subject: string;
}): Promise<void> {
  await adminDb.collection('assignments').add({
    ...params,
    dueDate: new Date(params.dueDate),
    createdAt: new Date(),
    submittedCount: 0,
    pendingCount: 0,
  });
}

export async function listSummaries(userId: string): Promise<SummaryRecord[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('summaries')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()
    .catch(() => null);

  const summaries: SummaryRecord[] =
    snapshot?.docs.map((item) => ({
      id: item.id,
      title: String(item.data().title || 'Summary'),
      sourceType: item.data().sourceType === 'PDF' ? 'PDF' : 'NOTE',
      content: String(item.data().content || ''),
      createdAt: serializeDate(item.data().createdAt),
      classroomId: String(item.data().classroomId || 'class-physics'),
    })) || [];

  if (summaries.length > 0) {
    return summaries;
  }

  return [
    {
      id: 'summary-1',
      title: 'Electromagnetism quick recap',
      sourceType: 'PDF',
      content: 'A concise recap of magnetic fields, right-hand rule, and induction with memory anchors.',
      createdAt: new Date().toISOString(),
      classroomId: 'class-physics',
    },
  ];
}

export async function saveSummary(params: {
  userId: string;
  title: string;
  content: string;
  sourceType: 'NOTE' | 'PDF';
  classroomId: string;
}): Promise<void> {
  await adminDb.collection('users').doc(params.userId).collection('summaries').add({
    title: params.title,
    content: params.content,
    sourceType: params.sourceType,
    classroomId: params.classroomId,
    createdAt: new Date(),
  });

  await awardXp(params.userId, 10, 'First Summary 🏅');
}

export async function listChatHistory(userId: string): Promise<ChatMessageRecord[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('chatHistory')
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get()
    .catch(() => null);

  return snapshot?.docs.flatMap((item) => {
    const data = item.data();
    return [
      {
        id: `${item.id}-user`,
        role: 'user' as const,
        content: String(data.message || ''),
        createdAt: serializeDate(data.createdAt),
      },
      {
        id: `${item.id}-assistant`,
        role: 'assistant' as const,
        content: String(data.assistantMessage || ''),
        createdAt: serializeDate(data.createdAt),
      },
    ];
  }) || [];
}

export async function saveChatTranscript(params: {
  userId: string;
  message: string;
  assistantMessage: string;
}): Promise<void> {
  await adminDb.collection('users').doc(params.userId).collection('chatHistory').add({
    message: params.message,
    assistantMessage: params.assistantMessage,
    createdAt: new Date(),
  });

  await awardXp(params.userId, 5);
}

export async function listSavedNotesServer(userId: string): Promise<SavedNote[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('savedNotes')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()
    .catch(() => null);

  return snapshot?.docs.map((item) => ({
    id: item.id,
    source: String(item.data().source || 'Saved note'),
    content: String(item.data().content || ''),
    createdAt: serializeDate(item.data().createdAt),
  })) || [];
}

export async function createSavedNoteServer(params: {
  userId: string;
  source: string;
  content: string;
}): Promise<void> {
  await adminDb.collection('users').doc(params.userId).collection('savedNotes').add({
    source: params.source,
    content: params.content,
    createdAt: new Date(),
  });
}

export async function deleteSavedNoteServer(userId: string, noteId: string): Promise<void> {
  await adminDb.collection('users').doc(userId).collection('savedNotes').doc(noteId).delete();
}

export async function listAttendance(date?: string): Promise<AttendanceStats> {
  const snapshot = await adminDb.collection('attendance').limit(100).get().catch(() => null);
  const records: AttendanceStats['records'] =
    snapshot?.docs.map((item) => ({
      id: item.id,
      studentName: String(item.data().student?.name || 'Student'),
      studentEmail: String(item.data().student?.email || 'student@smartclass.ai'),
      status: (item.data().status === 'ABSENT' ? 'ABSENT' : 'PRESENT') as 'PRESENT' | 'ABSENT',
      date: serializeDate(item.data().date),
    })) || [];

  const filtered = date
    ? records.filter((record) => record.date.slice(0, 10) === date)
    : records;

  const present = filtered.filter((record) => record.status === 'PRESENT').length || 18;
  const absent = filtered.filter((record) => record.status === 'ABSENT').length || 4;

  return {
    present,
    absent,
    records:
      filtered.length > 0
        ? filtered
        : [
            {
              id: 'att-1',
              studentName: 'Riya Sharma',
              studentEmail: 'riya@example.com',
              status: 'PRESENT',
              date: new Date().toISOString(),
            },
            {
              id: 'att-2',
              studentName: 'Kabir Singh',
              studentEmail: 'kabir@example.com',
              status: 'ABSENT',
              date: new Date().toISOString(),
            },
          ],
    weeklyTrend: [
      { day: 'Mon', present: 24, absent: 3 },
      { day: 'Tue', present: 21, absent: 6 },
      { day: 'Wed', present: 23, absent: 4 },
      { day: 'Thu', present: 25, absent: 2 },
      { day: 'Fri', present: 22, absent: 5 },
    ],
  };
}

export async function markAttendance(userId: string, status: 'PRESENT' | 'ABSENT'): Promise<void> {
  const existing = await adminDb
    .collection('attendance')
    .where('studentId', '==', userId)
    .get()
    .catch(() => null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const alreadyMarked = existing?.docs.some((item) => serializeDate(item.data().date).slice(0, 10) === todayKey);

  if (alreadyMarked) {
    throw new Error('Attendance already marked for today');
  }

  const user = await getUserProfile(userId);
  await adminDb.collection('attendance').add({
    studentId: userId,
    date: new Date(),
    status,
    createdAt: new Date(),
    student: {
      name: user.name,
      email: user.email,
    },
  });
}

export async function getStudentAttendanceHistory(userId: string): Promise<{
  markedToday: boolean;
  todayStatus: 'PRESENT' | 'ABSENT' | null;
  records: AttendanceStats['records'];
}> {
  const snapshot = await adminDb
    .collection('attendance')
    .where('studentId', '==', userId)
    .get()
    .catch(() => null);

  const records: AttendanceStats['records'] =
    snapshot?.docs
      .map((item) => ({
        id: item.id,
        studentName: String(item.data().student?.name || 'Student'),
        studentEmail: String(item.data().student?.email || 'student@smartclass.ai'),
        status: (item.data().status === 'ABSENT' ? 'ABSENT' : 'PRESENT') as 'PRESENT' | 'ABSENT',
        date: serializeDate(item.data().date),
      }))
      .sort((a, b) => b.date.localeCompare(a.date)) || [];

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((record) => record.date.slice(0, 10) === todayKey);

  return {
    markedToday: Boolean(todayRecord),
    todayStatus: todayRecord?.status || null,
    records: records.slice(0, 7),
  };
}

export async function getProgressStats(userId: string): Promise<ProgressStats> {
  const userSnapshot = await adminDb.collection('users').doc(userId).get();
  const userData = userSnapshot.data();
  const summaries = await listSummaries(userId);
  const quizzes = await listQuizAttempts(userId);
  const chatHistory = await listChatHistory(userId);
  const userMessageCount = chatHistory.filter((item) => item.role === 'user').length;

  const averageQuizScore =
    quizzes.length > 0
      ? Math.round(
          quizzes.reduce((sum, item) => sum + (item.score / item.total) * 100, 0) / quizzes.length,
        )
      : 0;

  const xp = Number(userData?.xp || summaries.length * 10 + quizzes.length * 20 + userMessageCount * 5);
  const badges = Array.isArray(userData?.badges) ? userData?.badges.map(String) : [];

  return {
    totalSummaries: summaries.length,
    totalQuizzes: quizzes.length,
    averageQuizScore,
    totalMessages: userMessageCount,
    streakDays: Number(userData?.streakDays || 3),
    xp,
    nextLevelXp: Math.max(100, Math.ceil((xp + 1) / 100) * 100),
    badges,
    engagement: [
      { name: 'PDFs', value: summaries.length || 3 },
      { name: 'Quizzes', value: quizzes.length || 2 },
      { name: 'Chats', value: Math.max(1, Math.ceil(chatHistory.length / 2)) },
    ],
    activityBreakdown: [
      { name: 'Summaries', value: summaries.length || 3 },
      { name: 'Quiz Score', value: averageQuizScore || 68 },
      { name: 'Streak', value: Number(userData?.streakDays || 3) * 10 },
    ],
    xpRules: [
      {
        label: 'PDF or note summary',
        xp: 10,
        description: 'Earned every time you generate an AI summary from class content.',
      },
      {
        label: 'Quiz game completed',
        xp: 20,
        description: 'Earned after finishing a 5-question quiz from a summary.',
      },
      {
        label: 'AI study chat',
        xp: 5,
        description: 'Earned for each study assistant question you send.',
      },
    ],
  };
}

export async function awardXp(userId: string, amount: number, badge?: string): Promise<void> {
  const userRef = adminDb.collection('users').doc(userId);
  const payload: Record<string, unknown> = {
    xp: FieldValue.increment(amount),
    updatedAt: new Date(),
  };

  if (badge) {
    payload.badges = FieldValue.arrayUnion(badge);
  }

  await userRef.set(payload, { merge: true });
}

export async function listQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('quizAttempts')
    .orderBy('completedAt', 'desc')
    .limit(20)
    .get()
    .catch(() => null);

  return snapshot?.docs.map((item) => ({
    id: item.id,
    summaryId: String(item.data().summaryId || ''),
    score: Number(item.data().score || 0),
    total: Number(item.data().total || 5),
    completedAt: serializeDate(item.data().completedAt),
  })) || [];
}

export async function saveQuizAttempt(params: {
  userId: string;
  summaryId: string;
  score: number;
  total: number;
}): Promise<void> {
  await adminDb.collection('users').doc(params.userId).collection('quizAttempts').add({
    summaryId: params.summaryId,
    score: params.score,
    total: params.total,
    completedAt: new Date(),
  });

  await awardXp(params.userId, 20, params.score >= 4 ? 'Quiz Master 🎯' : undefined);
}

export async function querySearchData(userId: string): Promise<SearchHit[]> {
  const [notes, summaries, chatHistory] = await Promise.all([
    listSavedNotesServer(userId),
    listSummaries(userId),
    listChatHistory(userId),
  ]);

  return [
    ...notes.map((item) => ({
      id: item.id,
      type: 'note' as const,
      title: item.source,
      content: item.content,
      createdAt: item.createdAt,
    })),
    ...summaries.map((item) => ({
      id: item.id,
      type: 'summary' as const,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
    })),
    ...chatHistory
      .filter((item) => item.role === 'assistant')
      .map((item) => ({
        id: item.id,
        type: 'chat' as const,
        title: 'Study assistant',
        content: item.content,
        createdAt: item.createdAt,
      })),
  ];
}

export async function getStudentDashboard(userId: string): Promise<DashboardPayload> {
  const [user, classrooms, announcements, assignments, recentSummaries, savedNotes, progress] = await Promise.all([
    getUserProfile(userId),
    listClassrooms(),
    listAnnouncements(),
    listAssignments(userId, 'STUDENT'),
    listSummaries(userId),
    listSavedNotesServer(userId),
    getProgressStats(userId),
  ]);

  return {
    user,
    dateLabel: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date()),
    classrooms,
    announcements,
    assignments,
    recentSummaries,
    savedNotes,
    progress,
  };
}

export async function getTeacherDashboard(userId: string): Promise<{
  user: AuthUser;
  classrooms: Classroom[];
  attendance: AttendanceStats;
  assignments: Assignment[];
  announcements: Announcement[];
  performance: StudentPerformance[];
}> {
  const [user, classrooms, attendance, assignments, announcements] = await Promise.all([
    getUserProfile(userId),
    listClassrooms(),
    listAttendance(),
    listAssignments(userId, 'TEACHER'),
    listAnnouncements(),
  ]);

  return {
    user,
    classrooms,
    attendance,
    assignments,
    announcements,
    performance: [
      {
        id: 'student-1',
        name: 'Riya Sharma',
        lastActive: 'Today at 8:30 AM',
        pdfsRead: 12,
        quizzesTaken: 6,
        engagement: 'HIGH',
      },
      {
        id: 'student-2',
        name: 'Kabir Singh',
        lastActive: 'Yesterday at 6:10 PM',
        pdfsRead: 7,
        quizzesTaken: 3,
        engagement: 'MEDIUM',
      },
      {
        id: 'student-3',
        name: 'Maya Joseph',
        lastActive: '3 days ago',
        pdfsRead: 2,
        quizzesTaken: 1,
        engagement: 'LOW',
      },
    ],
  };
}

export async function recordTeacherUpload(teacherId: string, title: string): Promise<void> {
  const classes = await listClassrooms();
  const classId = classes[0]?.id || 'class-physics';

  await adminDb.collection('teacherUploads').add({
    teacherId,
    title,
    classId,
    createdAt: new Date(),
  });

  await adminDb.collection('classrooms').doc(classId).set(
    {
      lastActivity: `${title} uploaded just now`,
    },
    { merge: true },
  );

  await adminDb.collection('classrooms').doc(classId).collection('announcements').add({
    title: 'New content uploaded',
    message: `${title} is now available in your classroom resources.`,
    createdAt: new Date(),
  });
}

export async function getUsageForToday(userId: string): Promise<{ count: number; resetAt: string }> {
  const usageRef = adminDb.collection('users').doc(userId).collection('usage').doc(getTodayUsageKey());
  const snapshot = await usageRef.get();
  const count = Number(snapshot.data()?.count || 0);
  return {
    count,
    resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
  };
}

export async function incrementUsageForToday(userId: string): Promise<{ count: number; remaining: number }> {
  const usageRef = adminDb.collection('users').doc(userId).collection('usage').doc(getTodayUsageKey());
  const result = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(usageRef);
    const count = Number(snapshot.data()?.count || 0);
    const nextCount = count + 1;
    if (nextCount > 20) {
      throw new Error('DAILY_LIMIT_REACHED');
    }
    transaction.set(
      usageRef,
      {
        count: nextCount,
        dateKey: getTodayUsageKey(),
        updatedAt: new Date(),
      },
      { merge: true },
    );
    return nextCount;
  });

  return { count: result, remaining: Math.max(0, 20 - result) };
}

export function getTodayUsageKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
