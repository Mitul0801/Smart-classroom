'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Download, DownloadCloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Note {
    id: string;
    title: string;
    content: string;
    fileUrl?: string;
    teacher: { name: string };
    createdAt: string;
}

interface Pdf {
    id: string;
    teacher: { name: string };
    fileUrl: string;
    createdAt: string;
}

export default function StudentNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [pdfs, setPdfs] = useState<Pdf[]>([]);

    useEffect(() => {
        fetch('/api/notes').then(res => res.json()).then(res => setNotes(res.data || []));
        fetch('/api/pdf').then(res => res.json()).then(res => setPdfs(res.data || []));
    }, []);

    return (
        <div className="p-8 max-w-5xl mx-auto z-10 relative">
            <h1 className="text-3xl font-bold mb-8 items-center flex gap-3 text-white">
                <BookOpen className="text-violet-400" /> Class Content
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-zinc-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" /> Uploaded Notes
                    </h2>
                    <div className="space-y-4">
                        {notes.length === 0 ? <p className="text-zinc-500">No notes available.</p> : notes.map(note => (
                            <Card key={note.id} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md">
                                <CardHeader className="bg-zinc-800/20 border-b border-zinc-800/50 py-3">
                                    <CardTitle className="text-lg text-zinc-100">{note.title}</CardTitle>
                                    <p className="text-xs text-zinc-400">By {note.teacher.name} on {new Date(note.createdAt).toLocaleDateString()}</p>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {note.content && (
                                        <div className="prose prose-invert prose-sm text-zinc-300 max-h-60 overflow-y-auto custom-scrollbar">
                                            <ReactMarkdown>{note.content}</ReactMarkdown>
                                        </div>
                                    )}
                                    <div className="flex gap-2 mt-4">
                                        {note.fileUrl && (
                                            <a href={note.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                                                <DownloadCloud className="w-4 h-4" /> Download
                                            </a>
                                        )}
                                        <button 
                                            onClick={async () => {
                                                const res = await fetch('/api/summarize', {
                                                    method: 'POST',
                                                    body: JSON.stringify({ text: note.content, type: 'summarize' }),
                                                    headers: { 'Content-Type': 'application/json' }
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    alert("AI Summary:\n\n" + data.result);
                                                }
                                            }}
                                            className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-2"
                                        >
                                            <BookOpen className="w-4 h-4" /> Summarize
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-zinc-100 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-400" /> Resources & PDFs
                    </h2>
                    <div className="space-y-4">
                        {pdfs.length === 0 ? <p className="text-zinc-500">No PDFs available.</p> : pdfs.map(pdf => (
                            <Card key={pdf.id} className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-md hover:bg-zinc-800/40 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-rose-400" /> {pdf.fileUrl.split('/').pop()?.split('-').slice(1).join('-') || 'Document'}
                                        </p>
                                        <p className="text-xs text-zinc-400">By {pdf.teacher.name} • {new Date(pdf.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <a href={pdf.fileUrl} target="_blank" rel="noreferrer" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors">
                                        <Download className="w-5 h-5" />
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
