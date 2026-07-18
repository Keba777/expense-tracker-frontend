import { apiClient } from "./client";
import type {
  ApiResponse,
  CreateLoanInput,
  CreateLoanPaymentInput,
  LoanFilter,
  LoanPayment,
  LoanWithBalance,
  UpdateLoanInput,
} from "@/types";

interface PaginatedLoans {
  data: LoanWithBalance[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

export const loansApi = {
  list: async (filter: LoanFilter = {}): Promise<PaginatedLoans> => {
    const { data } = await apiClient.get<ApiResponse<LoanWithBalance[]>>("/loans", {
      params: filter,
    });
    return { data: data.data ?? [], meta: data.meta! };
  },

  create: async (input: CreateLoanInput): Promise<LoanWithBalance> => {
    const { data } = await apiClient.post<ApiResponse<LoanWithBalance>>("/loans", input);
    return data.data!;
  },

  getById: async (id: string): Promise<LoanWithBalance> => {
    const { data } = await apiClient.get<ApiResponse<LoanWithBalance>>(`/loans/${id}`);
    return data.data!;
  },

  update: async (id: string, input: UpdateLoanInput): Promise<LoanWithBalance> => {
    const { data } = await apiClient.put<ApiResponse<LoanWithBalance>>(`/loans/${id}`, input);
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/loans/${id}`);
  },

  listPayments: async (loanId: string): Promise<LoanPayment[]> => {
    const { data } = await apiClient.get<ApiResponse<LoanPayment[]>>(`/loans/${loanId}/payments`);
    return data.data ?? [];
  },

  addPayment: async (loanId: string, input: CreateLoanPaymentInput): Promise<LoanWithBalance> => {
    const { data } = await apiClient.post<ApiResponse<LoanWithBalance>>(`/loans/${loanId}/payments`, input);
    return data.data!;
  },

  deletePayment: async (loanId: string, paymentId: string): Promise<LoanWithBalance> => {
    const { data } = await apiClient.delete<ApiResponse<LoanWithBalance>>(`/loans/${loanId}/payments/${paymentId}`);
    return data.data!;
  },
};
