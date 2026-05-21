"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { reportsApi } from "@/lib/api/reports";
import { SpendingDonut } from "@/components/charts/spending-donut";
import { TrendLine } from "@/components/charts/trend-line";
import { WeeklyBar } from "@/components/charts/weekly-bar";
import { formatMonthYear, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

type ReportTab = "monthly" | "weekly" | "trends";
type BreakdownType = "expense" | "income";

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const [tab, setTab] = useState<ReportTab>("monthly");
  const [breakdownType, setBreakdownType] = useState<BreakdownType>("expense");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ["reports", "monthly", year, month],
    queryFn: () => reportsApi.monthly(year, month),
    enabled: tab === "monthly",
  });

  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ["reports", "breakdown", year, month, breakdownType],
    queryFn: () => reportsApi.categoryBreakdown({ type: breakdownType, from, to }),
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

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const { transactionsApi } = await import("@/lib/api/transactions");
      const blob = await transactionsApi.exportCSV({ from, to });
      triggerDownload(blob, `transactions-${year}-${String(month).padStart(2, "0")}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const blob = await reportsApi.exportPDF({ from, to, currency: user?.currency });
      triggerDownload(blob, `report-${year}-${String(month).padStart(2, "0")}.pdf`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const TABS: { key: ReportTab; label: string }[] = [
    { key: "monthly", label: t.reports.monthly },
    { key: "weekly", label: t.reports.weekly },
    { key: "trends", label: t.reports.trends },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold">{t.reports.title}</h1>

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
          {/* Month picker + Export */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl surface-1 flex items-center justify-center hover:bg-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">{formatMonthYear(year, month)}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl surface-1 flex items-center justify-center hover:bg-accent transition-colors">
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
                  { label: t.reports.income, value: monthlyReport.summary.totalIncome, color: "text-income", bg: "bg-income/10" },
                  { label: t.reports.spent, value: monthlyReport.summary.totalExpense, color: "text-expense", bg: "bg-expense/10" },
                  { label: t.reports.saved, value: monthlyReport.summary.netBalance, color: "text-primary", bg: "bg-primary/10" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={cn("rounded-2xl p-3 text-center", bg)}>
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
                    <p className={cn("text-base font-bold tabular-nums", color)}>
                      {formatCurrency(value, user?.currency)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Export buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground surface-1 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {t.reports.exportCSV}
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isExportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {t.reports.exportPDF}
                </button>
              </div>

              {/* Breakdown type toggle */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {breakdownType === "expense" ? t.reports.spendingBreakdown : t.reports.incomeBreakdown}
                </p>
                <div className="flex bg-muted p-0.5 rounded-xl gap-0.5">
                  {(["expense", "income"] as const).map((bType) => (
                    <button
                      key={bType}
                      onClick={() => setBreakdownType(bType)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                        breakdownType === bType
                          ? bType === "income"
                            ? "bg-income text-white"
                            : "bg-expense text-white"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {bType === "income" ? t.reports.income : t.reports.expense}
                    </button>
                  ))}
                </div>
              </div>

              <SpendingDonut
                data={breakdownData}
                isLoading={breakdownLoading}
                currency={user?.currency}
                title={breakdownType === "income" ? t.reports.incomeBreakdown : t.reports.spendingBreakdown}
                emptyLabel={breakdownType === "income" ? t.charts.noIncome : t.charts.noExpenses}
              />

              <WeeklyBar data={monthlyReport.daily} />

              {/* Daily breakdown */}
              {monthlyReport.daily.length > 0 && (
                <div className="surface-1 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-semibold">{t.reports.dailyBreakdown}</p>
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
                  { label: t.reports.income, value: weeklyReport.summary.totalIncome, color: "text-income", bg: "bg-income/10" },
                  { label: t.reports.spent, value: weeklyReport.summary.totalExpense, color: "text-expense", bg: "bg-expense/10" },
                  { label: t.reports.net, value: weeklyReport.summary.netBalance, color: "text-primary", bg: "bg-primary/10" },
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
            <div className="surface-1 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold">{t.reports.monthByMonth}</p>
              {[...trends].reverse().map((trend) => (
                <div key={`${trend.year}-${trend.month}`} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{formatMonthYear(trend.year, trend.month)}</span>
                    <span className={cn(trend.income >= trend.expense ? "text-income" : "text-expense")}>
                      {trend.income >= trend.expense ? "+" : "-"}
                      {formatCurrency(Math.abs(trend.income - trend.expense), user?.currency)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="bg-income rounded-l-full" style={{ width: `${(trend.income / Math.max(trend.income, trend.expense, 1)) * 50}%` }} />
                    <div className="bg-expense rounded-r-full" style={{ width: `${(trend.expense / Math.max(trend.income, trend.expense, 1)) * 50}%` }} />
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
