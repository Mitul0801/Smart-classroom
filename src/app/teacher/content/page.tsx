'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, FileText } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TeacherContentPage() {
    const [loadingNote, setLoadingNote] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);

    async function handleUploadNote(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoadingNote(true);
        const title = (e.currentTarget.elements.namedItem('title') as HTMLInputElement).value;
        const content = (e.currentTarget.elements.namedItem('content') as HTMLTextAreaElement).value;

        const res = await fetch('/api/notes', {
            method: 'POST',
            body: JSON.stringify({ title, content }),
            headers: { 'Content-Type': 'application/json' }
        });
        setLoadingNote(false);
        if (res.ok) {
            toast.success("Note published successfully!");
            e.currentTarget.reset();
        } else {
            toast.error("Failed to publish note");
        }
    }

    async function handleUploadPdf(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoadingPdf(true);
        
        const fileInput = e.currentTarget.elements.namedItem('file') as HTMLInputElement;
        if (!fileInput.files || fileInput.files.length === 0) return;

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        const res = await fetch('/api/pdf/upload', {
            method: 'POST',
            body: formData,
        });
        
        setLoadingPdf(false);
        if (res.ok) {
            await res.json();
            toast.success("PDF uploaded and parsed successfully!");
            e.currentTarget.reset();
        } else {
            toast.error("Failed to upload PDF");
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto z-10 relative">
            <h1 className="text-3xl font-bold mb-8 items-center flex gap-3 text-white">
                <UploadCloud className="text-indigo-400 w-8 h-8" /> Upload Content
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Text Notes Upload */}
                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-zinc-200 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-400" /> Publish Note
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUploadNote} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-zinc-400">Chapter / Title</Label>
                                <Input id="title" name="title" required className="bg-zinc-950/50 border-zinc-800 text-zinc-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content" className="text-zinc-400">Body Content (Markdown Supported)</Label>
                                <textarea id="content" name="content" required className="flex min-h-[150px] w-full rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>
                            <Button type="submit" disabled={loadingNote} className="w-full bg-indigo-600 hover:bg-indigo-500">
                                {loadingNote ? 'Publishing...' : 'Publish Note'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* PDF Upload */}
                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-zinc-200 flex items-center gap-2">
                            <UploadCloud className="w-5 h-5 text-rose-400" /> Upload PDF resources
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUploadPdf} className="space-y-6">
                            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4 bg-zinc-950/30 hover:bg-zinc-950/50 transition-colors">
                                <UploadCloud className="w-12 h-12 text-zinc-600" />
                                <Label htmlFor="file" className="text-zinc-400 cursor-pointer">
                                    <span className="text-indigo-400 font-medium hover:text-indigo-300">Click to upload</span> or drag and drop
                                    <p className="text-xs mt-1">PDF max 10MB</p>
                                </Label>
                                <input id="file" name="file" type="file" accept="application/pdf" className="hidden" />
                            </div>
                            <Button type="submit" disabled={loadingPdf} className="w-full bg-rose-600 hover:bg-rose-500">
                                {loadingPdf ? 'Uploading...' : 'Upload PDF'}
                            </Button>
                        </form>
                        <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm flex gap-2 items-start">
                            <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>AI will automatically extract the text from the PDF so students can ask questions about it directly in their Study Assistant.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
