"use client";

import { TrendingUp, Target, Calendar, Wallet } from "lucide-react";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Summary } from "@/types";
import { cn } from "@/lib/utils";

interface StatsGridProps {
  summary?: Summary;
  isLoading?: boolean;
  currency?: string;
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function StatCard({ label, value, subValue, icon, color, isLoading }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", color)}>
        {icon}
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-16" />
        </>
      ) : (
        <>
          <div>
            <p className="text-xl font-bold leading-none">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

export function StatsGrid({ summary, isLoading, currency = "USD" }: StatsGridProps) {
  const netBalance = summary?.netBalance ?? 0;
  const savingsRate = summary?.savingsRate ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;

  const avgDaily = totalExpense > 0 ? totalExpense / new Date().getDate() : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Savings"
        value={formatCurrency(netBalance, currency)}
        subValue="this month"
        icon={<Wallet className="w-4 h-4 text-violet-400" />}
        color="bg-violet-500/15"
        isLoading={isLoading}
      />
      <StatCard
        label="Savings rate"
        value={`${savingsRate.toFixed(1)}%`}
        subValue={savingsRate >= 20 ? "Great job!" : "Keep going"}
        icon={<Target className="w-4 h-4 text-income" />}
        color="bg-income/15"
        isLoading={isLoading}
      />
      <StatCard
        label="Avg. daily spend"
        value={`$${formatCompact(avgDaily)}`}
        subValue={`${new Date().getDate()} days so far`}
        icon={<Calendar className="w-4 h-4 text-amber-400" />}
        color="bg-amber-500/15"
        isLoading={isLoading}
      />
      <StatCard
        label="Total income"
        value={`$${formatCompact(totalIncome)}`}
        subValue="this month"
        icon={<TrendingUp className="w-4 h-4 text-sky-400" />}
        color="bg-sky-500/15"
        isLoading={isLoading}
      />
    </div>
  );
}
