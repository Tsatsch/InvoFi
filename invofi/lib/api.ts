const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  senderCompany: string;
  senderName: string;
  senderAddress: string;
  senderEmail: string;
  senderPhone: string;
  recipientCompany: string;
  recipientName: string;
  recipientAddress: string;
  recipientEmail: string;
  items: InvoiceItem[];
  bankName: string;
  accountNumber: string;
  taxRate: number;
  notes?: string;
}

export const api = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await fetch(`${API_URL}/api/invoices`);
    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }
    return response.json();
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await fetch(`${API_URL}/api/invoices/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }
    return response.json();
  },

  downloadInvoice: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/invoices/${id}/download`);
    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]
      : `invoice-${id}.pdf`;

    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  generateInvoice: async (invoiceData: Invoice): Promise<void> => {
    const response = await fetch(`${API_URL}/api/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      throw new Error('Failed to generate invoice');
    }

    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]
      : `invoice-${invoiceData.invoiceNumber}.pdf`;

    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}; 