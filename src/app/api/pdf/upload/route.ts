import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as pdfParseModule from 'pdf-parse';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

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

        // In a real production app, upload the file to S3/Supabase.
        // For development, we'll write to public/uploads directory
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = path.join(uploadsDir, fileName);
        await fs.writeFile(filePath, buffer);

        const fileUrl = `/uploads/${fileName}`;

        // Create PDF record
        const pdf = await prisma.pdf.create({
            data: {
                teacherId: session.userId,
                fileUrl,
                summary: textContent.slice(0, 1000) // Temporary just a slice, we can use summarize API in a separate chain
            }
        });

        // Try hitting internal summarize API or return text for frontend to hit it
        // To keep it clean, we return the parsed text so the frontend can display it or ask for a summary.

        return NextResponse.json({ success: true, data: pdf, extractedText: textContent }, { status: 201 });
    } catch (error) {
        console.error('PDF Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
