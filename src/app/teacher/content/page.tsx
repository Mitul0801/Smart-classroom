'use client';

import { useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function TeacherContentPage() {
  const [loadingNote, setLoadingNote] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const posthog = usePostHog();

  async function handleUploadNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    setLoadingNote(true);

    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    setLoadingNote(false);
    if (!response.ok) {
      toast.error('Failed to publish note');
      return;
    }

    posthog?.capture('pdf_upload', { type: 'note' });
    toast.success('Note published');
    form.reset();
  }

  async function handleUploadPdf(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('file') as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      toast.error('Please choose a PDF');
      return;
    }

    setLoadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/pdf/upload', {
      method: 'POST',
      body: formData,
    });

    setLoadingPdf(false);
    if (!response.ok) {
      toast.error('Failed to upload PDF');
      return;
    }

    posthog?.capture('pdf_upload', { type: 'pdf' });
    toast.success('PDF uploaded');
    form.reset();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>Publish a note</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleUploadNote}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" className="h-11 rounded-2xl" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea id="content" name="content" required className="min-h-52 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/60" />
            </div>
            <Button className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white" disabled={loadingNote}>
              {loadingNote ? 'Publishing...' : 'Publish note'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-[2rem]">
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleUploadPdf}>
            <label htmlFor="file" className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center dark:border-white/10 dark:bg-white/5">
              <p className="font-medium text-slate-900 dark:text-slate-50">Choose or drop a PDF here</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Students will receive browser alerts when new content lands.</p>
              <input id="file" name="file" type="file" accept="application/pdf" className="hidden" />
            </label>
            <Button className="rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white" disabled={loadingPdf}>
              {loadingPdf ? 'Uploading...' : 'Upload PDF'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
