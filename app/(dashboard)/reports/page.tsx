"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { reportsApi } from "@/lib/api/reports";
import { SpendingDonut } from "@/components/charts/spending-donut";
import { TrendLine } from "@/components/charts/trend-line";
import { WeeklyBar } from "@/components/charts/weekly-bar";
import { formatMonthYear, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";

type ReportTab = "monthly" | "weekly" | "trends";

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<ReportTab>("monthly");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ["reports", "monthly", year, month],
    queryFn: () => reportsApi.monthly(year, month),
    enabled: tab === "monthly",
  });

  const { data: weeklyReport, isLoading: weeklyLoading } = useQuery({
    queryKey: ["reports", "weekly"],
    queryFn: () => reportsApi.weekly(),
    enabled: tab === "weekly",
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["trends", 12],
    queryFn: () => reportsApi.trends(12),
    enabled: tab === "trends",
  });

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const TABS: { key: ReportTab; label: string }[] = [
    { key: "monthly", label: "Monthly" },
    { key: "weekly", label: "Weekly" },
    { key: "trends", label: "Trends" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold">Reports</h1>

      {/* Tabs */}
      <div className="flex bg-muted p-1 rounded-2xl gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 h-9 rounded-xl text-sm font-medium transition-all",
              tab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Monthly tab */}
      {tab === "monthly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">{formatMonthYear(year, month)}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {monthlyLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[0,1,2].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : monthlyReport ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Income", value: monthlyReport.summary.totalIncome, color: "text-income", bg: "bg-income/10" },
                  { label: "Spent", value: monthlyReport.summary.totalExpense, color: "text-expense", bg: "bg-expense/10" },
                  { label: "Saved", value: monthlyReport.summary.netBalance, color: "text-primary", bg: "bg-primary/10" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={cn("rounded-2xl p-3 text-center", bg)}>
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
                    <p className={cn("text-base font-bold tabular-nums", color)}>
                      {formatCurrency(value, user?.currency)}
                    </p>
                  </div>
                ))}
              </div>

              <SpendingDonut data={monthlyReport.breakdown} currency={user?.currency} />

              <WeeklyBar data={monthlyReport.daily} />

              {/* Daily breakdown */}
              {monthlyReport.daily.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-semibold">Daily Breakdown</p>
                  {monthlyReport.daily
                    .sort((a, b) => b.expense - a.expense)
                    .slice(0, 10)
                    .map((day) => (
                      <div key={day.date} className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-14 text-xs">{day.date.slice(5)}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-expense/70 rounded-full"
                            style={{ width: `${Math.min((day.expense / (monthlyReport.summary.totalExpense || 1)) * 100 * 5, 100)}%` }}
                          />
                        </div>
                        <span className="text-expense text-xs tabular-nums w-20 text-right">
                          -{formatCurrency(day.expense, user?.currency)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Weekly tab */}
      {tab === "weekly" && (
        <div className="space-y-4">
          {weeklyLoading ? (
            <CardSkeleton />
          ) : weeklyReport ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Income", value: weeklyReport.summary.totalIncome, color: "text-income", bg: "bg-income/10" },
                  { label: "Spent", value: weeklyReport.summary.totalExpense, color: "text-expense", bg: "bg-expense/10" },
                  { label: "Net", value: weeklyReport.summary.netBalance, color: "text-primary", bg: "bg-primary/10" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={cn("rounded-2xl p-3 text-center", bg)}>
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
                    <p className={cn("text-base font-bold", color)}>{formatCurrency(value, user?.currency)}</p>
                  </div>
                ))}
              </div>
              <WeeklyBar data={weeklyReport.daily} />
              <SpendingDonut data={weeklyReport.breakdown} currency={user?.currency} />
            </>
          ) : null}
        </div>
      )}

      {/* Trends tab */}
      {tab === "trends" && (
        <div className="space-y-4">
          <TrendLine data={trends} isLoading={trendsLoading} />
          {trends && trends.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold">Month by Month</p>
              {[...trends].reverse().map((t) => (
                <div key={`${t.year}-${t.month}`} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{formatMonthYear(t.year, t.month)}</span>
                    <span className={cn(t.income >= t.expense ? "text-income" : "text-expense")}>
                      {t.income >= t.expense ? "+" : "-"}
                      {formatCurrency(Math.abs(t.income - t.expense), user?.currency)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="bg-income rounded-l-full" style={{ width: `${(t.income / Math.max(t.income, t.expense, 1)) * 50}%` }} />
                    <div className="bg-expense rounded-r-full" style={{ width: `${(t.expense / Math.max(t.income, t.expense, 1)) * 50}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
