"use client";

import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useT } from "@/lib/i18n";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Summary } from "@/types";

interface BalanceCardProps {
  summary?: Summary;
  isLoading?: boolean;
  currency?: string;
}

export function BalanceCard({ summary, isLoading, currency = "USD" }: BalanceCardProps) {
  const user = useAuthStore((s) => s.user);
  const openAddTransaction = useUIStore((s) => s.openAddTransaction);
  const t = useT();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t.balance.greetingMorning;
    if (h < 17) return t.balance.greetingAfternoon;
    return t.balance.greetingEvening;
  };

  return (
    <div className="noise relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-white">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.45) 0%, transparent 60%)",
        }}
      />
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm font-medium">
              {greeting()}, {user?.firstName} 👋
            </p>
          </div>
          <button
            onClick={() => openAddTransaction()}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all rounded-xl px-3 py-1.5 text-sm font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.balance.add}
          </button>
        </div>

        <div className="mb-6">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
            {t.balance.netBalance}
          </p>
          {isLoading ? (
            <div className="h-10 w-44 bg-white/10 rounded-xl animate-pulse" />
          ) : (
            <p className="text-4xl font-bold tracking-tight num">
              {formatCurrency(summary?.netBalance ?? 0, currency)}
            </p>
          )}
          {!isLoading && summary && (
            <p className="text-white/60 text-xs mt-1">
              {summary.savingsRate >= 0 ? "+" : ""}
              {summary.savingsRate.toFixed(1)}% {t.balance.savingsRateSuffix}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-income/30 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-income" />
              </div>
              <span className="text-white/60 text-xs">{t.balance.income}</span>
            </div>
            {isLoading ? (
              <div className="h-6 w-20 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-income">
                +{formatCompact(summary?.totalIncome ?? 0)}
              </p>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-expense/30 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-expense" />
              </div>
              <span className="text-white/60 text-xs">{t.balance.expenses}</span>
            </div>
            {isLoading ? (
              <div className="h-6 w-20 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-expense">
                -{formatCompact(summary?.totalExpense ?? 0)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
