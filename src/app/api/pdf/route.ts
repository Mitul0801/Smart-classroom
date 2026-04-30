import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const snapshot = await adminDb.collection('pdfs').orderBy('createdAt', 'desc').get();
        
        const pdfs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        return NextResponse.json({ data: pdfs }, { status: 200 });
    } catch (error: any) {
        console.error('PDF Fetch Error:', {
            message: error?.message,
            stack: error?.stack
        });
        return NextResponse.json({ 
            error: 'Failed to list PDFs', 
            details: error?.message || 'Unknown error' 
        }, { status: 500 });
    }
}
