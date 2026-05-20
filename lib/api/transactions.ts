import { apiClient } from "./client";
import type {
  ApiResponse,
  Category,
  CreateTransactionInput,
  Summary,
  Transaction,
  TransactionFilter,
} from "@/types";

interface PaginatedTransactions {
  data: Transaction[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

export const transactionsApi = {
  list: async (filter: TransactionFilter = {}): Promise<PaginatedTransactions> => {
    const { data } = await apiClient.get<ApiResponse<Transaction[]>>("/transactions", {
      params: filter,
    });
    return { data: data.data ?? [], meta: data.meta! };
  },

  create: async (input: CreateTransactionInput): Promise<Transaction> => {
    const { data } = await apiClient.post<ApiResponse<Transaction>>("/transactions", input);
    return data.data!;
  },

  getById: async (id: string): Promise<Transaction> => {
    const { data } = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return data.data!;
  },

  update: async (id: string, input: Partial<CreateTransactionInput>): Promise<Transaction> => {
    const { data } = await apiClient.put<ApiResponse<Transaction>>(`/transactions/${id}`, input);
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  summary: async (params?: { from?: string; to?: string }): Promise<Summary> => {
    const { data } = await apiClient.get<ApiResponse<Summary>>("/transactions/summary", { params });
    return data.data!;
  },

  exportCSV: async (params?: { from?: string; to?: string; type?: string }): Promise<Blob> => {
    const { data } = await apiClient.get("/transactions/export", { params, responseType: "blob" });
    return data as Blob;
  },
};

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<ApiResponse<Category[]>>("/categories");
    return data.data ?? [];
  },

  create: async (input: { name: string; icon: string; color: string; type: string }): Promise<Category> => {
    const { data } = await apiClient.post<ApiResponse<Category>>("/categories", input);
    return data.data!;
  },

  update: async (id: string, input: { name: string; icon: string; color: string; type: string }): Promise<Category> => {
    const { data } = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, input);
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
