import { apiClient, type ApiResponse } from '@/lib/api';

export interface LeaseDto {
  id: string;
  clusterAccountId: string;
  clusterAccountName?: string | null;
  unitId: string;
  unitCatalogCode?: string | null;
  propertyName?: string | null;
  tenantUserId: string;
  tenantName?: string | null;
  tenantEmail?: string | null;
  startDate: string;
  endDate?: string | null;
  rentAmount: number;
  rentFrequency: number;
  status: number; // 0=Pending,1=Active,2=Expired,3=Terminated
  approvalStatus?: number | null; // 0=Pending,1=Approved,2=Rejected
  notes?: string | null;
  createdAt: string;
  renewalStatus: number; // 0=None,1=Requested,2=Approved,3=Rejected
  proposedRentAmount?: number | null;
  proposedEndDate?: string | null;
  renewalRequestedAt?: string | null;
  renewalNotes?: string | null;
}

export interface PaymentDto {
  id: string;
  leaseId: string;
  amount: number;
  paystackReference: string;
  status: number; // 0=Pending,1=Completed,2=Failed,3=Refunded
  paymentDate?: string | null;
  receiptNumber?: string | null;
  createdAt: string;
}

export interface InitiatePaymentResult {
  authorizationUrl: string;
  reference: string;
}

export interface RequestRenewalData {
  proposedEndDate: string;
  proposedRentAmount?: number;
  notes?: string;
}

// Ported verbatim from fe-nivah-tenant-web/services/leaseService.ts — the Tailwind class strings
// work as-is via NativeWind's className support, so no re-mapping is needed.
export const LEASE_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  1: { label: 'Active', color: 'bg-green-100 text-green-700' },
  2: { label: 'Expired', color: 'bg-gray-100 text-gray-600' },
  3: { label: 'Terminated', color: 'bg-red-100 text-red-700' },
};

export const APPLICATION_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Application Under Review', color: 'bg-amber-100 text-amber-700' },
  1: { label: 'Application Approved', color: 'bg-green-100 text-green-700' },
  2: { label: 'Application Rejected', color: 'bg-red-100 text-red-700' },
};

export const PAYMENT_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  1: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  2: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  3: { label: 'Refunded', color: 'bg-purple-100 text-purple-700' },
};

export const RENEWAL_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'None', color: 'bg-gray-100 text-gray-600' },
  1: { label: 'Renewal Requested', color: 'bg-amber-100 text-amber-700' },
  2: { label: 'Renewal Approved', color: 'bg-green-100 text-green-700' },
  3: { label: 'Renewal Rejected', color: 'bg-red-100 text-red-700' },
};

export const RENT_FREQUENCY: Record<number, string> = {
  1: 'Monthly',
  2: 'Quarterly',
  3: 'Annually',
};

export const leaseService = {
  async getMyLeases(): Promise<ApiResponse<LeaseDto[]>> {
    const response = await apiClient.get<ApiResponse<LeaseDto[]>>('/api/v1/Lease/my-leases');
    return response.data;
  },

  async getPayments(leaseId: string): Promise<ApiResponse<PaymentDto[]>> {
    const response = await apiClient.get<ApiResponse<PaymentDto[]>>(`/api/v1/Lease/${leaseId}/payments`);
    return response.data;
  },

  async payForLease(leaseId: string): Promise<ApiResponse<InitiatePaymentResult>> {
    const response = await apiClient.post<ApiResponse<InitiatePaymentResult>>(`/api/v1/Marketplace/leases/${leaseId}/pay`);
    return response.data;
  },

  async requestRenewal(leaseId: string, data: RequestRenewalData): Promise<ApiResponse<LeaseDto>> {
    const response = await apiClient.post<ApiResponse<LeaseDto>>(`/api/v1/LeaseRenewal/${leaseId}/request`, data);
    return response.data;
  },
};

// Ported from app/(main)/my-leases/page.tsx's per-card status derivation.
export function getLeaseStatusBadge(lease: LeaseDto): { label: string; color: string; noteBanner?: string | null } {
  const isPendingApplication = lease.status === 0;
  const isRejectedApplication = lease.status === 3 && lease.approvalStatus === 2;

  if (isRejectedApplication) {
    return { ...APPLICATION_STATUS[2], noteBanner: lease.notes };
  }
  if (isPendingApplication) {
    return APPLICATION_STATUS[lease.approvalStatus ?? 0];
  }
  return LEASE_STATUS[lease.status];
}

export function canPayForLease(lease: LeaseDto): boolean {
  return lease.status === 0 && lease.approvalStatus === 1;
}
