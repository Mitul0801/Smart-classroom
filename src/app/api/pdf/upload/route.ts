import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PDFParse } from 'pdf-parse';
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

        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        const textContent = result.text;
        await parser.destroy();

        const fileName = `pdfs/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        const fileRef = bucket.file(fileName);

        await fileRef.save(buffer, {
            metadata: { contentType: 'application/pdf' },
        });

        // Make the file publicly accessible or get a signed URL
        // For simplicity in this app, we'll use the public URL format if the bucket is public
        // Or generate a signed URL with a long expiration
        const [fileUrl] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
        });

        const teacherDoc = await adminDb.collection('users').doc(session.userId).get();
        const teacherData = teacherDoc.exists ? teacherDoc.data() : { name: 'Unknown Teacher' };

        const pdfRef = await adminDb.collection('pdfs').add({
            teacherId: session.userId || '',
            teacher: {
                name: teacherData?.name || 'Unknown Teacher'
            },
            fileUrl: fileUrl || null,
            summary: textContent ? textContent.slice(0, 1000) : '',
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
