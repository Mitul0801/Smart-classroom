import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  createAssignment,
  listAssignments,
  upsertAssignmentSubmission,
} from '@/lib/firebase/admin-services';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await listAssignments(session.userId, session.role === 'TEACHER' ? 'TEACHER' : 'STUDENT');
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    dueDate?: string;
    classId?: string;
    className?: string;
    subject?: string;
  };

  if (!body.title || !body.dueDate || !body.classId || !body.className || !body.subject) {
    return NextResponse.json({ error: 'Missing assignment fields' }, { status: 400 });
  }

  await createAssignment({
    title: body.title,
    description: body.description || '',
    dueDate: body.dueDate,
    classId: body.classId,
    className: body.className,
    subject: body.subject,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { assignmentId?: string; status?: 'PENDING' | 'DONE' };
  if (!body.assignmentId || !body.status) {
    return NextResponse.json({ error: 'Missing assignment update fields' }, { status: 400 });
  }

  await upsertAssignmentSubmission({
    userId: session.userId,
    assignmentId: body.assignmentId,
    status: body.status,
  });

  return NextResponse.json({ success: true });
}
