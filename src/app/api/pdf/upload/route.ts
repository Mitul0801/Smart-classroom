import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { recordTeacherUpload } from '@/lib/firebase/admin-services';
import { getDownloadURL } from 'firebase-admin/storage';

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

        // 1. Extract text for AI features
        let textContent = '';
        try {
            const result = await pdfParse(buffer);
            textContent = result.text;
        } catch (e) {
            console.warn('PDF parsing failed, continuing with empty text:', e);
        }

        // 2. Upload to Firebase Storage
        const bucket = adminStorage.bucket();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `uploads/${Date.now()}-${safeName}`;
        const fileRef = bucket.file(fileName);

        await fileRef.save(buffer, {
            metadata: {
                contentType: 'application/pdf',
            }
        });

        // 3. Get Download URL
        const fileUrl = await getDownloadURL(fileRef);

        // 4. Save metadata to Firestore
        const teacherDoc = await adminDb.collection('users').doc(session.userId).get();
        const teacherData = teacherDoc.exists ? teacherDoc.data() : { name: 'Unknown Teacher' };

        const pdfRef = await adminDb.collection('pdfs').add({
            teacherId: session.userId || '',
            teacher: {
                name: teacherData?.name || 'Unknown Teacher'
            },
            fileUrl: fileUrl,
            fileName: file.name,
            summary: textContent ? textContent.slice(0, 1000) : 'No summary available.',
            createdAt: new Date()
        });

        // 5. Record the activity
        await recordTeacherUpload(session.userId, file.name);

        return NextResponse.json({ 
            success: true, 
            data: { id: pdfRef.id, fileUrl }, 
            extractedText: textContent 
        }, { status: 201 });

    } catch (error: any) {
        console.error('PDF Upload Error Details:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack
        });
        return NextResponse.json({ 
            error: 'Failed to upload PDF', 
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
