import { NextResponse } from 'next/server';
import { mockInvoices } from '@/lib/mock-data';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = mockInvoices.find(inv => inv.id === params.id);
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
} 