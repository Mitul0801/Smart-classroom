import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as pdfParseModule from 'pdf-parse';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

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

        // Upload to Vercel Blob
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const blob = await put(fileName, file, {
            access: 'public',
        });

        const fileUrl = blob.url;

        // Create PDF record
        const pdf = await prisma.pdf.create({
            data: {
                teacherId: session.userId,
                fileUrl,
                summary: textContent.slice(0, 1000) 
            }
        });

        return NextResponse.json({ success: true, data: pdf, extractedText: textContent }, { status: 201 });
    } catch (error) {
        console.error('PDF Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
