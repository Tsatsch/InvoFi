import { NextResponse } from 'next/server';
import { mockInvoices } from '@/lib/mock-data';

export async function GET() {
  try {
    // In a real application, you would fetch this from a database
    return NextResponse.json(mockInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
} 