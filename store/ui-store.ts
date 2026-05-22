"use client";

import { create } from "zustand";
import type { Transaction } from "@/types";

interface UIState {
  isAddTransactionOpen: boolean;
  defaultTransactionType: "income" | "expense";
  editingTransaction: Transaction | null;
  openAddTransaction: (type?: "income" | "expense") => void;
  openEditTransaction: (transaction: Transaction) => void;
  closeAddTransaction: () => void;
  viewingTransaction: Transaction | null;
  openViewTransaction: (transaction: Transaction) => void;
  closeViewTransaction: () => void;
  isAllTransactionsOpen: boolean;
  openAllTransactions: () => void;
  closeAllTransactions: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddTransactionOpen: false,
  defaultTransactionType: "expense",
  editingTransaction: null,
  openAddTransaction: (type = "expense") =>
    set({ isAddTransactionOpen: true, defaultTransactionType: type, editingTransaction: null }),
  openEditTransaction: (transaction: Transaction) =>
    set({ isAddTransactionOpen: true, editingTransaction: transaction, defaultTransactionType: transaction.type }),
  closeAddTransaction: () => set({ isAddTransactionOpen: false, editingTransaction: null }),
  viewingTransaction: null,
  openViewTransaction: (transaction: Transaction) => set({ viewingTransaction: transaction }),
  closeViewTransaction: () => set({ viewingTransaction: null }),
  isAllTransactionsOpen: false,
  openAllTransactions: () => set({ isAllTransactionsOpen: true }),
  closeAllTransactions: () => set({ isAllTransactionsOpen: false }),
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
