"use client";

import { create } from "zustand";

interface UIState {
  isAddTransactionOpen: boolean;
  defaultTransactionType: "income" | "expense";
  openAddTransaction: (type?: "income" | "expense") => void;
  closeAddTransaction: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddTransactionOpen: false,
  defaultTransactionType: "expense",
  openAddTransaction: (type = "expense") =>
    set({ isAddTransactionOpen: true, defaultTransactionType: type }),
  closeAddTransaction: () => set({ isAddTransactionOpen: false }),
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
