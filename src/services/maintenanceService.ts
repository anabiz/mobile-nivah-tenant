import { apiClient, type ApiResponse } from '@/lib/api';

export interface MaintenanceRequestDto {
  id: string;
  ticketNumber: string;
  unitId: string;
  unitCatalogCode: string;
  categoryId?: string | null;
  categoryName?: string | null;
  title: string;
  description: string;
  priority: number;
  status: number;
  reportedByName: string;
  reportedByPhone?: string | null;
  createdByUserId: string;
  assignedToUserId?: string | null;
  assignedToUserName?: string | null;
  assignedToContractorId?: string | null;
  assignedToContractorName?: string | null;
  rootCause?: string | null;
  recommendations?: string | null;
  completionNotes?: string | null;
  totalCost: number;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  slaResolutionDueAt?: string | null;
}

export interface CreateMaintenanceRequestData {
  unitId: string;
  categoryId?: string;
  title: string;
  description: string;
  priority: number;
  reportedByName: string;
  reportedByPhone?: string;
}

export interface VerifyRequestData {
  approved: boolean;
  feedback?: string;
}

export interface MaintenanceCategoryDto {
  id: string;
  clusterAccountId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface UnitDto {
  id: string;
  propertyId: string;
  propertyName?: string | null;
  catalogCode: string;
  floorName?: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  result: T[];
}

export interface MaintenanceCommentDto {
  id: string;
  maintenanceRequestId: string;
  userId: string;
  userName: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

export interface MaintenanceCostItemDto {
  id: string;
  maintenanceRequestId: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface AttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType?: string | null;
  fileSize?: number;
  type?: string;
  createdAt: string;
}

// A picked file from expo-image-picker/expo-document-picker, shaped for RN's FormData.
export interface RNFile {
  uri: string;
  name: string;
  type: string;
}

// Ported verbatim from fe-nivah-tenant-web/services/maintenanceService.ts.
export const PRIORITY_LABELS: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
export const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-orange-100 text-orange-700',
  4: 'bg-red-100 text-red-700',
};
export const STATUS_LABELS: Record<number, string> = {
  1: 'New',
  2: 'Assigned',
  3: 'In Progress',
  4: 'Pending Approval',
  5: 'Pending Materials',
  6: 'Awaiting Verification',
  7: 'Completed',
  8: 'Rejected',
  9: 'Rework Required',
  10: 'Cancelled',
};
export const STATUS_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-gray-100 text-gray-700',
  6: 'bg-indigo-100 text-indigo-700',
  7: 'bg-green-100 text-green-700',
  8: 'bg-red-100 text-red-700',
  9: 'bg-pink-100 text-pink-700',
  10: 'bg-gray-200 text-gray-500',
};

export const OPEN_STATUSES = [1, 2, 3, 4, 5, 6, 9];
export const CANCELLABLE_STATUSES = [1, 2];
const TERMINAL_STATUSES = [7, 8, 10];

export type SlaStatus = 'onTrack' | 'atRisk' | 'breached' | 'met' | 'missed';

export const SLA_LABELS: Record<SlaStatus, string> = {
  onTrack: 'SLA On Track',
  atRisk: 'SLA At Risk',
  breached: 'SLA Breached',
  met: 'SLA Met',
  missed: 'SLA Missed',
};

export const SLA_COLORS: Record<SlaStatus, string> = {
  onTrack: 'bg-green-100 text-green-700',
  atRisk: 'bg-amber-100 text-amber-700',
  breached: 'bg-red-100 text-red-700',
  met: 'bg-green-100 text-green-700',
  missed: 'bg-red-100 text-red-700',
};

export function getSlaStatus(
  request: Pick<MaintenanceRequestDto, 'status' | 'createdAt' | 'resolvedAt' | 'closedAt' | 'slaResolutionDueAt'>,
): SlaStatus | null {
  if (!request.slaResolutionDueAt) return null;
  const due = new Date(request.slaResolutionDueAt).getTime();

  if (TERMINAL_STATUSES.includes(request.status)) {
    const finishedAt = request.closedAt || request.resolvedAt;
    if (!finishedAt) return null;
    return new Date(finishedAt).getTime() <= due ? 'met' : 'missed';
  }

  const now = Date.now();
  if (now > due) return 'breached';

  const created = new Date(request.createdAt).getTime();
  const window = due - created;
  const remaining = due - now;
  if (window > 0 && remaining / window < 0.25) return 'atRisk';
  return 'onTrack';
}

function toFormData(file: RNFile, fieldName: string, formData: FormData) {
  // React Native's FormData accepts { uri, name, type } for file fields.
  formData.append(fieldName, file as unknown as Blob);
}

export const maintenanceService = {
  async getMyRequests(params?: {
    currentPage?: number;
    pageSize?: number;
    status?: number;
  }): Promise<ApiResponse<PaginatedResponse<MaintenanceRequestDto>>> {
    const queryParams = new URLSearchParams();
    if (params?.currentPage) queryParams.append('CurrentPage', params.currentPage.toString());
    if (params?.pageSize) queryParams.append('PageSize', params.pageSize.toString());
    if (params?.status !== undefined) queryParams.append('Status', params.status.toString());
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MaintenanceRequestDto>>>(
      `/api/v1/MaintenanceRequest?${queryParams.toString()}`,
    );
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<MaintenanceRequestDto>> {
    const response = await apiClient.get<ApiResponse<MaintenanceRequestDto>>(`/api/v1/MaintenanceRequest/${id}`);
    return response.data;
  },

  async create(data: CreateMaintenanceRequestData): Promise<ApiResponse<MaintenanceRequestDto>> {
    const response = await apiClient.post<ApiResponse<MaintenanceRequestDto>>('/api/v1/MaintenanceRequest', data);
    return response.data;
  },

  async verify(id: string, data: VerifyRequestData): Promise<ApiResponse<MaintenanceRequestDto>> {
    const response = await apiClient.put<ApiResponse<MaintenanceRequestDto>>(`/api/v1/MaintenanceRequest/${id}/verify`, data);
    return response.data;
  },

  async getCategories(clusterAccountId: string): Promise<ApiResponse<MaintenanceCategoryDto[]>> {
    const response = await apiClient.get<ApiResponse<MaintenanceCategoryDto[]>>(
      `/api/v1/MaintenanceCategory/by-account/${clusterAccountId}`,
    );
    return response.data;
  },

  async getMyUnits(): Promise<ApiResponse<UnitDto[]>> {
    const response = await apiClient.get<ApiResponse<UnitDto[]>>('/api/v1/Unit/my-units');
    return response.data;
  },

  async uploadAttachments(
    requestId: string,
    files: RNFile[],
    type: 'General' | 'Evidence' | 'Invoice' = 'General',
  ): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    files.forEach((f) => toFormData(f, 'files', formData));
    const response = await apiClient.post<ApiResponse<unknown>>(
      `/api/v1/Attachments/MaintenanceRequest/${requestId}?type=${type}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  async getAttachments(requestId: string, type?: 'General' | 'Evidence' | 'Invoice'): Promise<ApiResponse<AttachmentDto[]>> {
    const query = type ? `?type=${type}` : '';
    const response = await apiClient.get<ApiResponse<AttachmentDto[]>>(`/api/v1/Attachments/MaintenanceRequest/${requestId}${query}`);
    return response.data;
  },

  async cancel(id: string): Promise<ApiResponse<boolean>> {
    const response = await apiClient.put<ApiResponse<boolean>>(`/api/v1/MaintenanceRequest/${id}/cancel`);
    return response.data;
  },

  async addComment(id: string, comment: string): Promise<ApiResponse<MaintenanceCommentDto>> {
    const response = await apiClient.post<ApiResponse<MaintenanceCommentDto>>(`/api/v1/MaintenanceRequest/${id}/comments`, { comment });
    return response.data;
  },

  async getComments(id: string): Promise<ApiResponse<MaintenanceCommentDto[]>> {
    const response = await apiClient.get<ApiResponse<MaintenanceCommentDto[]>>(`/api/v1/MaintenanceRequest/${id}/comments`);
    return response.data;
  },

  // Technician methods
  async updateStatus(id: string, status: number): Promise<ApiResponse<MaintenanceRequestDto>> {
    const response = await apiClient.put<ApiResponse<MaintenanceRequestDto>>(`/api/v1/MaintenanceRequest/${id}/status`, { status });
    return response.data;
  },

  async submitInvestigation(
    id: string,
    data: { rootCause?: string; recommendations?: string; materialsRequired?: string },
    file?: RNFile,
  ): Promise<ApiResponse<MaintenanceRequestDto>> {
    const formData = new FormData();
    if (data.rootCause) formData.append('RootCause', data.rootCause);
    if (data.recommendations) formData.append('Recommendations', data.recommendations);
    if (data.materialsRequired) formData.append('MaterialsRequired', data.materialsRequired);
    if (file) toFormData(file, 'file', formData);
    const response = await apiClient.put<ApiResponse<MaintenanceRequestDto>>(`/api/v1/MaintenanceRequest/${id}/investigation`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async submitCompletion(
    id: string,
    data: { completionNotes?: string },
    files?: RNFile[],
  ): Promise<ApiResponse<MaintenanceRequestDto>> {
    const response = await apiClient.put<ApiResponse<MaintenanceRequestDto>>(`/api/v1/MaintenanceRequest/${id}/completion`, data);
    if (files && files.length > 0) {
      const formData = new FormData();
      files.forEach((f) => toFormData(f, 'files', formData));
      await apiClient.post(`/api/v1/Attachments/MaintenanceRequest/${id}?type=Evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return response.data;
  },

  async addCostItem(id: string, data: { description: string; amount: number }): Promise<ApiResponse<MaintenanceCostItemDto>> {
    const response = await apiClient.post<ApiResponse<MaintenanceCostItemDto>>(`/api/v1/MaintenanceRequest/${id}/cost-items`, data);
    return response.data;
  },

  async getCostItems(id: string): Promise<ApiResponse<MaintenanceCostItemDto[]>> {
    const response = await apiClient.get<ApiResponse<MaintenanceCostItemDto[]>>(`/api/v1/MaintenanceRequest/${id}/cost-items`);
    return response.data;
  },
};
