import { apiClient } from "./client";
import type { ApiResponse, CreatePersonInput, Person, PersonWithBalance } from "@/types";

export const peopleApi = {
  list: async (): Promise<PersonWithBalance[]> => {
    const { data } = await apiClient.get<ApiResponse<PersonWithBalance[]>>("/people");
    return data.data ?? [];
  },

  create: async (input: CreatePersonInput): Promise<Person> => {
    const { data } = await apiClient.post<ApiResponse<Person>>("/people", input);
    return data.data!;
  },

  getById: async (id: string): Promise<PersonWithBalance> => {
    const { data } = await apiClient.get<ApiResponse<PersonWithBalance>>(`/people/${id}`);
    return data.data!;
  },

  update: async (id: string, input: CreatePersonInput): Promise<Person> => {
    const { data } = await apiClient.put<ApiResponse<Person>>(`/people/${id}`, input);
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/people/${id}`);
  },
};
