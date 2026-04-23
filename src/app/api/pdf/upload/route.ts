import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { adminDb, adminStorage } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let textContent = '';
        try {
            const result = await pdfParse(buffer);
            textContent = result.text;
        } catch (e) {
            console.warn('PDF parsing skipped or failed:', e);
        }

        // Save locally to bypass Firebase Storage limitations
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadsDir, fileName);
        
        await fs.writeFile(filePath, buffer);
        const fileUrl = `/uploads/${fileName}`;

        const teacherDoc = await adminDb.collection('users').doc(session.userId).get();
        const teacherData = teacherDoc.exists ? teacherDoc.data() : { name: 'Unknown Teacher' };

        const pdfRef = await adminDb.collection('pdfs').add({
            teacherId: session.userId || '',
            teacher: {
                name: teacherData?.name || 'Unknown Teacher'
            },
            fileUrl: fileUrl,
            summary: textContent ? textContent.slice(0, 1000) : 'No summary available.',
            createdAt: new Date()
        });

        return NextResponse.json({ 
            success: true, 
            data: { id: pdfRef.id, fileUrl }, 
            extractedText: textContent 
        }, { status: 201 });
    } catch (error) {
        console.error('PDF Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
