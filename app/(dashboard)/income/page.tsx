"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { transactionsApi } from "@/lib/api/transactions";
import { TransactionGroup } from "@/components/transactions/transaction-card";
import { TransactionSkeleton } from "@/components/ui/skeleton";
import { groupTransactionsByDate, formatMonthYear, formatCurrency, percentageChange } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function IncomePage() {
  const user = useAuthStore((s) => s.user);
  const openAddTransaction = useUIStore((s) => s.openAddTransaction);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;
  const prevFrom = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
  const prevLastDay = new Date(prevY, prevM, 0).getDate();
  const prevTo = `${prevY}-${String(prevM).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", { type: "income", from, to }],
    queryFn: () => transactionsApi.list({ type: "income", from, to, perPage: 50 }),
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", from, to],
    queryFn: () => transactionsApi.summary({ from, to }),
  });

  const { data: prevSummary } = useQuery({
    queryKey: ["summary", prevFrom, prevTo],
    queryFn: () => transactionsApi.summary({ from: prevFrom, to: prevTo }),
  });

  const transactions = data?.data ?? [];
  const grouped = groupTransactionsByDate(transactions);
  const change = percentageChange(summary?.totalIncome ?? 0, prevSummary?.totalIncome ?? 0);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Income</h1>
        <button
          onClick={() => openAddTransaction("income")}
          className="flex items-center gap-1.5 bg-income/15 text-income text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-income/25 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Month navigator */}
      <div className="bg-gradient-income rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">{formatMonthYear(year, month)}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/70 text-xs mb-1">Total Income</p>
          <p className="text-3xl font-bold">{formatCurrency(summary?.totalIncome ?? 0, user?.currency)}</p>
          {prevSummary && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className={cn("w-3.5 h-3.5", change >= 0 ? "text-white" : "rotate-180 text-white/60")} />
              <span className="text-xs text-white/80">
                {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs last month
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sources breakdown */}
      {!isLoading && transactions.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold">Income Sources</p>
          {Array.from(
            transactions.reduce((map, t) => {
              const key = t.category?.name ?? "Other";
              const icon = t.category?.icon ?? "💰";
              const cur = map.get(key) ?? { name: key, icon, total: 0 };
              cur.total += t.amount;
              map.set(key, cur);
              return map;
            }, new Map<string, { name: string; icon: string; total: number }>())
          ).map(([name, { icon, total }]) => {
            const pct = ((total / (summary?.totalIncome || 1)) * 100).toFixed(0);
            return (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="font-medium">{name}</span>
                  </span>
                  <span className="tabular-nums">{formatCurrency(total, user?.currency)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-income rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : !transactions.length ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <span className="text-4xl block mb-3">💼</span>
          <p className="font-semibold">No income recorded</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Add your salary or other income</p>
          <button
            onClick={() => openAddTransaction("income")}
            className="inline-flex items-center gap-2 bg-income text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-income/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add income
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([date, txns]) => (
            <TransactionGroup key={date} date={date} transactions={txns} currency={user?.currency} />
          ))}
        </div>
      )}

      <button
        onClick={() => openAddTransaction("income")}
        className="fixed right-4 bottom-20 md:bottom-6 z-40 w-14 h-14 rounded-full bg-income text-white shadow-glow-income flex items-center justify-center hover:bg-income/90 transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
