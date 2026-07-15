import { apiClient, type ApiResponse } from '@/lib/api';

export interface TokenData {
  accessToken: string;
  expiresIn: string;
  refreshToken: string;
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  roleStr: string;
  id: string;
  clusterAccountId?: string;
  profilePictureUrl?: string | null;
}

export interface VerifyOtpResponse {
  token: TokenData;
  user: UserData;
  requiresTwoFactor?: boolean;
}

export const authService = {
  async sendLoginOtp(email: string): Promise<ApiResponse<string>> {
    const response = await apiClient.post<ApiResponse<string>>('/api/v1/auths/login-otp', JSON.stringify(email));
    return response.data;
  },

  async verifyOtp(email: string, otp: string): Promise<ApiResponse<VerifyOtpResponse>> {
    const response = await apiClient.post<ApiResponse<VerifyOtpResponse>>('/api/v1/auths/verify-otp', { otp, email });
    return response.data;
  },

  async loginWithPassword(email: string, password: string): Promise<ApiResponse<VerifyOtpResponse>> {
    const response = await apiClient.post<ApiResponse<VerifyOtpResponse>>('/api/v1/auths/login', { email, password });
    return response.data;
  },
};
