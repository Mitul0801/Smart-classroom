'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Download, DownloadCloud, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    const [summaryState, setSummaryState] = useState<{ isOpen: boolean, content: string, title: string }>({ isOpen: false, content: '', title: '' });
    const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/notes')
            .then(async res => {
                const payload = await res.json();
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'baseline',hypothesisId:'H2',location:'src/app/student/notes/page.tsx:32',message:'Notes endpoint result',data:{ok:res.ok,status:res.status,hasData:Array.isArray(payload?.data),error:payload?.error||null},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                if (!res.ok) {
                    toast.error(payload?.error || 'Failed to load notes');
                    setNotes([]);
                    return;
                }
                setNotes(payload.data || []);
            });
        fetch('/api/pdf')
            .then(async res => {
                const payload = await res.json();
                // #region agent log
                fetch('http://127.0.0.1:7481/ingest/a62793e9-faf6-4aa5-8fae-f241bfabcb8d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d74878'},body:JSON.stringify({sessionId:'d74878',runId:'baseline',hypothesisId:'H2',location:'src/app/student/notes/page.tsx:39',message:'PDF endpoint result',data:{ok:res.ok,status:res.status,hasData:Array.isArray(payload?.data),error:payload?.error||null},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                if (!res.ok) {
                    toast.error(payload?.error || 'Failed to load PDFs');
                    setPdfs([]);
                    return;
                }
                setPdfs(payload.data || []);
            });
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
                                            disabled={loadingSummaryId === note.id}
                                            onClick={async () => {
                                                setLoadingSummaryId(note.id);
                                                try {
                                                    const res = await fetch('/api/summarize', {
                                                        method: 'POST',
                                                        body: JSON.stringify({ text: note.content, type: 'summarize' }),
                                                        headers: { 'Content-Type': 'application/json' }
                                                    });
                                                    const data = await res.json();
                                                    if (res.ok) {
                                                        setSummaryState({ isOpen: true, content: data.result, title: note.title });
                                                    } else {
                                                        toast.error("Failed to summarize");
                                                    }
                                                } catch (e) {
                                                    toast.error("An error occurred");
                                                } finally {
                                                    setLoadingSummaryId(null);
                                                }
                                            }}
                                            className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {loadingSummaryId === note.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                                            {loadingSummaryId === note.id ? 'Summarizing...' : 'Summarize'}
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

            <Dialog open={summaryState.isOpen} onOpenChange={(open) => setSummaryState(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle>AI Summary: {summaryState.title}</DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-invert prose-sm text-zinc-300">
                        <ReactMarkdown>{summaryState.content}</ReactMarkdown>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
