"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { SpendingDonut } from "@/components/charts/spending-donut";
import { TrendLine } from "@/components/charts/trend-line";
import { WeeklyBar } from "@/components/charts/weekly-bar";
import { TransactionGroup } from "@/components/transactions/transaction-card";
import { TransactionSkeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { transactionsApi } from "@/lib/api/transactions";
import { reportsApi } from "@/lib/api/reports";
import { getCurrentMonthRange, groupTransactionsByDate } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const openAddTransaction = useUIStore((s) => s.openAddTransaction);
  const { from, to } = getCurrentMonthRange();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["summary", from, to],
    queryFn: () => transactionsApi.summary({ from, to }),
  });

  const { data: recentData, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", { page: 1, perPage: 10 }],
    queryFn: () => transactionsApi.list({ page: 1, perPage: 10 }),
  });

  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ["breakdown", from, to],
    queryFn: () => reportsApi.categoryBreakdown({ type: "expense", from, to }),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["trends", 6],
    queryFn: () => reportsApi.trends(6),
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weekly-report"],
    queryFn: () => reportsApi.weekly(),
  });

  const transactions = recentData?.data ?? [];
  const grouped = groupTransactionsByDate(transactions);

  return (
    <div className="space-y-4 animate-fade-in">
      <BalanceCard summary={summary} isLoading={summaryLoading} currency={user?.currency} />

      <StatsGrid summary={summary} isLoading={summaryLoading} currency={user?.currency} />

      <WeeklyBar data={weeklyData?.daily} isLoading={weeklyLoading} />

      <SpendingDonut data={breakdown} isLoading={breakdownLoading} currency={user?.currency} />

      <TrendLine data={trends} isLoading={trendsLoading} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Recent Transactions</p>
          <Link href="/expenses" className="text-xs text-primary font-medium hover:underline">
            View all
          </Link>
        </div>

        {txLoading ? (
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)}
          </div>
        ) : !transactions.length ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <span className="text-4xl block mb-3">🧾</span>
            <p className="font-semibold mb-1">No transactions yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start tracking your money</p>
            <button
              onClick={() => openAddTransaction()}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add first transaction
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(grouped.entries()).map(([date, txns]) => (
              <TransactionGroup
                key={date}
                date={date}
                transactions={txns}
                currency={user?.currency}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => openAddTransaction()}
        className="fixed right-4 bottom-20 md:bottom-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        aria-label="Add transaction"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
