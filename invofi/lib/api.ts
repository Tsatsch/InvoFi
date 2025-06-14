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
  getInvoices: async (): Promise<Invoice[]> => {   // TODO: вот сюда нужна добавить Allow
    const response = await fetch('/api/invoices',
      {
        headers: {
          'Access-Control-Allow-Origin': '*',  //:TODO REMOVE
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400'
        }
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }
    return response.json();
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await fetch(`/api/invoices/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }
    return response.json();
  },

  downloadInvoice: async (id: string): Promise<void> => {
    const response = await fetch(`/api/invoices/${id}/download`);
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
    const response = await fetch('/api/invoices/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || 'Failed to generate invoice');
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
  },

  tokenizeInvoice: async (id: string): Promise<any> => {
    const response = await fetch(`/api/invoices/${id}/tokenize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to tokenize invoice and parse error response." }));
      throw new Error(errorData.details || errorData.error || 'Failed to tokenize invoice');
    }
    return response.json();
  }
}; 