import { apiClient } from "./client";
import type { ApiResponse, AuthResponse, LoginInput, RegisterInput, TokenPair, User } from "@/types";

export const authApi = {
  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", input);
    return data.data!;
  },

  login: async (input: LoginInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", input);
    return data.data!;
  },

  refresh: async (refreshToken: string): Promise<TokenPair> => {
    const { data } = await apiClient.post<ApiResponse<TokenPair>>("/auth/refresh", { refreshToken });
    return data.data!;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
    return data.data!;
  },

  forgotPassword: async (identifier: string): Promise<void> => {
    await apiClient.post("/auth/forgot-password", { identifier });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post("/auth/reset-password", { token, password });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put("/users/password", { currentPassword, newPassword });
  },
};
