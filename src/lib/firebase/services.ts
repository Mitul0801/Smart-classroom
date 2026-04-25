'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LivePoll, SavedNote, SearchHit, SharedClassNote } from '@/lib/types';

function toDateString(value: unknown): string {
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

export async function saveChatNote(params: {
  userId: string;
  source: string;
  content: string;
}): Promise<void> {
  await addDoc(collection(db, 'users', params.userId, 'savedNotes'), {
    source: params.source,
    content: params.content,
    createdAt: serverTimestamp(),
  });
}

export async function fetchSavedNotes(userId: string): Promise<SavedNote[]> {
  const snapshot = await getDocs(
    query(
      collection(db, 'users', userId, 'savedNotes'),
      orderBy('createdAt', 'desc'),
      limit(50),
    ),
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    source: String(item.data().source || 'Saved note'),
    content: String(item.data().content || ''),
    createdAt: toDateString(item.data().createdAt),
  }));
}

export async function deleteSavedNote(userId: string, noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'savedNotes', noteId));
}

export async function addSharedNote(classId: string, authorName: string, text: string): Promise<void> {
  await addDoc(collection(db, 'classrooms', classId, 'sharedNotes'), {
    authorName,
    text: text.slice(0, 500),
    pinned: false,
    upvotes: 0,
    createdAt: serverTimestamp(),
  });
}

export async function updateSharedNotePin(classId: string, noteId: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(db, 'classrooms', classId, 'sharedNotes', noteId), { pinned });
}

export async function deleteSharedNote(classId: string, noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'classrooms', classId, 'sharedNotes', noteId));
}

export async function upvoteSharedNote(classId: string, noteId: string, userId: string): Promise<void> {
  const voteRef = doc(db, 'classrooms', classId, 'sharedNotes', noteId, 'votes', userId);
  const noteRef = doc(db, 'classrooms', classId, 'sharedNotes', noteId);

  await runTransaction(db, async (transaction) => {
    const voteDoc = await transaction.get(voteRef);
    if (voteDoc.exists()) {
      return;
    }
    transaction.set(voteRef, { createdAt: serverTimestamp() });
    transaction.update(noteRef, { upvotes: increment(1) });
  });
}

export function subscribeToSharedNotes(
  classId: string,
  callback: (notes: SharedClassNote[]) => void,
): () => void {
  const ref = query(
    collection(db, 'classrooms', classId, 'sharedNotes'),
    orderBy('pinned', 'desc'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(ref, (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        authorName: String(item.data().authorName || 'Student'),
        text: String(item.data().text || ''),
        upvotes: Number(item.data().upvotes || 0),
        pinned: Boolean(item.data().pinned),
        createdAt: toDateString(item.data().createdAt),
      })),
    );
  });
}

export function subscribeToLivePoll(
  classId: string,
  callback: (poll: LivePoll | null) => void,
): () => void {
  const ref = query(
    collection(db, 'classrooms', classId, 'polls'),
    where('active', '==', true),
    orderBy('createdAt', 'desc'),
    limit(1),
  );

  return onSnapshot(ref, (snapshot) => {
    const first = snapshot.docs[0];
    if (!first) {
      callback(null);
      return;
    }

    const data = first.data();
    callback({
      id: first.id,
      classId,
      question: String(data.question || ''),
      active: Boolean(data.active),
      createdAt: toDateString(data.createdAt),
      options: Array.isArray(data.options)
        ? data.options.map((option: unknown, index: number) => {
            const value = option as { id?: string; label?: string; votes?: number };
            return {
              id: String(value.id || `option-${index}`),
              label: String(value.label || `Option ${index + 1}`),
              votes: Number(value.votes || 0),
            };
          })
        : [],
    });
  });
}

export async function voteOnPoll(
  classId: string,
  pollId: string,
  optionId: string,
  userId: string,
): Promise<void> {
  const pollRef = doc(db, 'classrooms', classId, 'polls', pollId);
  const voteRef = doc(db, 'classrooms', classId, 'polls', pollId, 'votes', userId);

  await runTransaction(db, async (transaction) => {
    const [pollSnap, voteSnap] = await Promise.all([
      transaction.get(pollRef),
      transaction.get(voteRef),
    ]);

    if (!pollSnap.exists() || voteSnap.exists()) {
      return;
    }

    const data = pollSnap.data();
    const options = Array.isArray(data.options)
      ? data.options.map((item: unknown) => {
          const option = item as { id?: string; label?: string; votes?: number };
          if (option.id === optionId) {
            return { ...option, votes: Number(option.votes || 0) + 1 };
          }
          return option;
        })
      : [];

    transaction.set(voteRef, { optionId, createdAt: serverTimestamp() });
    transaction.update(pollRef, { options });
  });
}

export async function markNotificationPreference(
  userId: string,
  enabled: boolean,
): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      notifications: {
        browserEnabled: enabled,
      },
    },
    { merge: true },
  );
}

export async function fetchNotificationPreference(userId: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, 'users', userId));
  return Boolean(snapshot.data()?.notifications?.browserEnabled);
}

export async function createTeacherAnnouncement(params: {
  classId: string;
  title: string;
  message: string;
}): Promise<void> {
  await addDoc(collection(db, 'classrooms', params.classId, 'announcements'), {
    title: params.title,
    message: params.message,
    createdAt: serverTimestamp(),
  });
}

export async function createLivePoll(params: {
  classId: string;
  question: string;
  options: string[];
}): Promise<void> {
  const activePolls = await getDocs(
    query(
      collection(db, 'classrooms', params.classId, 'polls'),
      where('active', '==', true),
    ),
  );

  await Promise.all(activePolls.docs.map((item) => updateDoc(item.ref, { active: false })));

  await addDoc(collection(db, 'classrooms', params.classId, 'polls'), {
    question: params.question,
    active: true,
    options: params.options.map((label, index) => ({
      id: `option-${index + 1}`,
      label,
      votes: 0,
    })),
    createdAt: serverTimestamp(),
  });
}

export async function querySearchIndex(userId: string): Promise<SearchHit[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(40)];
  const [notesSnap, summariesSnap, chatSnap] = await Promise.all([
    getDocs(query(collection(db, 'users', userId, 'savedNotes'), ...constraints)),
    getDocs(query(collection(db, 'users', userId, 'summaries'), ...constraints)),
    getDocs(query(collection(db, 'users', userId, 'chatHistory'), ...constraints)),
  ]);

  return [
    ...notesSnap.docs.map((item) => ({
      id: item.id,
      type: 'note' as const,
      title: String(item.data().source || 'Saved note'),
      content: String(item.data().content || ''),
      createdAt: toDateString(item.data().createdAt),
    })),
    ...summariesSnap.docs.map((item) => ({
      id: item.id,
      type: 'summary' as const,
      title: String(item.data().title || 'Summary'),
      content: String(item.data().content || ''),
      createdAt: toDateString(item.data().createdAt),
    })),
    ...chatSnap.docs.map((item) => ({
      id: item.id,
      type: 'chat' as const,
      title: 'Chat history',
      content: String(item.data().assistantMessage || item.data().message || ''),
      createdAt: toDateString(item.data().createdAt),
    })),
  ];
}
