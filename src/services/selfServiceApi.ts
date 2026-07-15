import { apiClient, type ApiResponse } from '@/lib/api';

const BASE = '/api/v1/TenantSelfService';

export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  category?: string | null;
  priority: number;
  propertyName?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  createdByName?: string | null;
}

export const ANNOUNCEMENT_PRIORITY: Record<number, { label: string; color: string }> = {
  0: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  1: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  2: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  3: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export const selfServiceApi = {
  getAnnouncements: (): Promise<ApiResponse<AnnouncementDto[]>> =>
    apiClient.get<ApiResponse<AnnouncementDto[]>>(`${BASE}/announcements`).then((r) => r.data),
};
