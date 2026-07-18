"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet";
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet";
import { AddPersonSheet } from "@/components/people/add-person-sheet";
import { AddLoanSheet } from "@/components/people/add-loan-sheet";
import { AddPaymentSheet } from "@/components/people/add-payment-sheet";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <main className="md:pl-64">
        <div className="max-w-2xl mx-auto md:max-w-none px-4 safe-top-pad pb-24 md:pb-8 md:px-8">
          {children}
        </div>
      </main>
      <BottomNav />
      <AddTransactionSheet />
      <TransactionDetailSheet />
      <AddPersonSheet />
      <AddLoanSheet />
      <AddPaymentSheet />
    </div>
  );
}
