import { apiClient, type ApiResponse } from '@/lib/api';

export interface RentInvoiceDto {
  id: string;
  leaseId: string;
  invoiceNumber: string;
  unitCatalogCode?: string | null;
  propertyName?: string | null;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: number;
  paidAt?: string | null;
  daysOverdue: number;
}

export interface PaymentReceiptDto {
  receiptNumber: string;
  invoiceNumber: string;
  tenantName?: string | null;
  tenantEmail?: string | null;
  propertyName?: string | null;
  unitCatalogCode?: string | null;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  amountPaid: number;
  paidAt?: string | null;
  paystackReference?: string | null;
}

export const INVOICE_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  1: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  2: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  3: { label: 'Partial', color: 'bg-blue-100 text-blue-700' },
  4: { label: 'Waived', color: 'bg-gray-100 text-gray-600' },
};

export const financialService = {
  async getMyInvoices(): Promise<ApiResponse<RentInvoiceDto[]>> {
    const response = await apiClient.get<ApiResponse<RentInvoiceDto[]>>('/api/v1/Financial/invoices/my');
    return response.data;
  },

  async getReceipt(invoiceId: string): Promise<ApiResponse<PaymentReceiptDto>> {
    const response = await apiClient.get<ApiResponse<PaymentReceiptDto>>(`/api/v1/Financial/invoices/${invoiceId}/receipt`);
    return response.data;
  },
};
