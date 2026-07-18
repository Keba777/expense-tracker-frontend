"use client";

import { create } from "zustand";
import type { Loan, LoanDirection, LoanWithBalance, Person, Transaction } from "@/types";

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
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  isAddPersonOpen: boolean;
  editingPerson: Person | null;
  openAddPerson: () => void;
  openEditPerson: (person: Person) => void;
  closeAddPerson: () => void;

  isAddLoanOpen: boolean;
  defaultLoanDirection: LoanDirection;
  prefilledPersonId: string | null;
  editingLoan: Loan | null;
  openAddLoan: (direction?: LoanDirection, personId?: string) => void;
  openEditLoan: (loan: Loan) => void;
  closeAddLoan: () => void;

  isAddPaymentOpen: boolean;
  payingLoan: LoanWithBalance | null;
  openAddPayment: (loan: LoanWithBalance) => void;
  closeAddPayment: () => void;
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
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  isAddPersonOpen: false,
  editingPerson: null,
  openAddPerson: () => set({ isAddPersonOpen: true, editingPerson: null }),
  openEditPerson: (person: Person) => set({ isAddPersonOpen: true, editingPerson: person }),
  closeAddPerson: () => set({ isAddPersonOpen: false, editingPerson: null }),

  isAddLoanOpen: false,
  defaultLoanDirection: "lent",
  prefilledPersonId: null,
  editingLoan: null,
  openAddLoan: (direction = "lent", personId) =>
    set({
      isAddLoanOpen: true,
      defaultLoanDirection: direction,
      prefilledPersonId: personId ?? null,
      editingLoan: null,
    }),
  openEditLoan: (loan: Loan) =>
    set({
      isAddLoanOpen: true,
      editingLoan: loan,
      defaultLoanDirection: loan.direction,
      prefilledPersonId: loan.personId,
    }),
  closeAddLoan: () => set({ isAddLoanOpen: false, editingLoan: null, prefilledPersonId: null }),

  isAddPaymentOpen: false,
  payingLoan: null,
  openAddPayment: (loan: LoanWithBalance) => set({ isAddPaymentOpen: true, payingLoan: loan }),
  closeAddPayment: () => set({ isAddPaymentOpen: false, payingLoan: null }),
}));
