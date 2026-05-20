import { apiClient } from "./client";
import type { ApiResponse, MonthlyReport, MonthlyTrend, WeeklyReport, CategoryTotal } from "@/types";

export const reportsApi = {
  monthly: async (year: number, month: number): Promise<MonthlyReport> => {
    const { data } = await apiClient.get<ApiResponse<MonthlyReport>>("/reports/monthly", {
      params: { year, month },
    });
    return data.data!;
  },

  weekly: async (from?: string): Promise<WeeklyReport> => {
    const { data } = await apiClient.get<ApiResponse<WeeklyReport>>("/reports/weekly", {
      params: from ? { from } : undefined,
    });
    return data.data!;
  },

  trends: async (months = 6): Promise<MonthlyTrend[]> => {
    const { data } = await apiClient.get<ApiResponse<MonthlyTrend[]>>("/reports/trends", {
      params: { months },
    });
    return data.data ?? [];
  },

  categoryBreakdown: async (params?: {
    type?: "income" | "expense";
    from?: string;
    to?: string;
  }): Promise<CategoryTotal[]> => {
    const { data } = await apiClient.get<ApiResponse<CategoryTotal[]>>("/reports/category-breakdown", {
      params,
    });
    return data.data ?? [];
  },
};
