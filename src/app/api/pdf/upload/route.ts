import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as pdfParseModule from 'pdf-parse';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

        // Parse PDF to extract text
        const parsed = await pdfParse(buffer);
        const textContent = parsed.text;

        // Upload to Firebase Storage
        const fileName = `pdfs/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, buffer, {
            contentType: 'application/pdf',
        });
        
        const fileUrl = await getDownloadURL(storageRef);

        // Create PDF record in Firestore
        const pdfRef = await addDoc(collection(db, 'pdfs'), {
            teacherId: session.userId,
            fileUrl,
            summary: textContent.slice(0, 1000),
            createdAt: serverTimestamp()
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
