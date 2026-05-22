"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronLeft, ChevronRight, TrendingUp, Search, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useT } from "@/lib/i18n";
import { transactionsApi, categoriesApi } from "@/lib/api/transactions";
import { TransactionGroup } from "@/components/transactions/transaction-card";
import { TransactionSkeleton } from "@/components/ui/skeleton";
import { groupTransactionsByDate, formatCurrency, percentageChange, getWeekDates } from "@/lib/utils";
import { useDateFormat } from "@/lib/use-date-format";
import { translateCategory } from "@/lib/category-translations";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

type DateView = "week" | "month" | "custom";

export default function IncomePage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const openAddTransaction = useUIStore((s) => s.openAddTransaction);
  const openEditTransaction = useUIStore((s) => s.openEditTransaction);
  const openViewTransaction = useUIStore((s) => s.openViewTransaction);
  const t = useT();
  const { formatMonthYear, lang } = useDateFormat();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateView, setDateView] = useState<DateView>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);

  const monthFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthLastDay = new Date(year, month, 0).getDate();
  const monthTo = `${year}-${String(month).padStart(2, "0")}-${String(monthLastDay).padStart(2, "0")}`;
  const weekDates = getWeekDates();

  const from =
    dateView === "week" ? weekDates.from
    : dateView === "custom" ? (customFrom || monthFrom)
    : monthFrom;
  const to =
    dateView === "week" ? weekDates.to
    : dateView === "custom" ? (customTo || monthTo)
    : monthTo;

  // For month-over-month comparison (only meaningful in month view)
  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;
  const prevFrom = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
  const prevLastDay = new Date(prevY, prevM, 0).getDate();
  const prevTo = `${prevY}-${String(prevM).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });
  const incomeCategories = categoriesData.filter((c: any) => c.type === "income");

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", { type: "income", from, to, search: debouncedSearch, categoryId: selectedCategory, page }],
    queryFn: () =>
      transactionsApi.list({
        type: "income",
        from,
        to,
        search: debouncedSearch || undefined,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        page,
        perPage: 30,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", from, to],
    queryFn: () => transactionsApi.summary({ from, to }),
  });

  const { data: prevSummary } = useQuery({
    queryKey: ["summary", prevFrom, prevTo],
    queryFn: () => transactionsApi.summary({ from: prevFrom, to: prevTo }),
    enabled: dateView === "month",
  });

  const { mutate: deleteTransaction } = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta;
  const grouped = groupTransactionsByDate(transactions);
  const change = percentageChange(summary?.totalIncome ?? 0, prevSummary?.totalIncome ?? 0);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setPage(1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setPage(1);
  };

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["summary"] });
  };

  const setView = (v: DateView) => { setDateView(v); setPage(1); };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.income.title}</h1>
        <button
          onClick={() => openAddTransaction("income")}
          className="flex items-center gap-1.5 bg-income/15 text-income text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-income/25 press transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.income.add}
        </button>
      </div>

      {/* Month navigator hero */}
      <div className="noise bg-gradient-income rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 press">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">{formatMonthYear(year, month)}</span>
            <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 press">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/70 text-xs mb-1">{t.income.totalIncome}</p>
          <p className="text-3xl font-bold num">{formatCurrency(summary?.totalIncome ?? 0, user?.currency)}</p>
          {prevSummary && dateView === "month" && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className={cn("w-3.5 h-3.5", change >= 0 ? "text-white" : "rotate-180 text-white/60")} />
              <span className="text-xs text-white/80">
                {change >= 0 ? "+" : ""}{change.toFixed(1)}% {t.income.vsLastMonth}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sources breakdown */}
      {!isLoading && transactions.length > 0 && (
        <div className="surface-1 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold">{t.income.sources}</p>
          {Array.from(
            transactions.reduce((map, tx) => {
              const key = tx.category?.name ?? "Other";
              const icon = tx.category?.icon ?? "💰";
              const cur = map.get(key) ?? { name: key, icon, total: 0 };
              cur.total += tx.amount;
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

      {/* Date view chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {(["week", "month", "custom"] as DateView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium press transition-colors",
              dateView === v ? "bg-primary text-primary-foreground" : "surface-1 text-muted-foreground hover:text-foreground"
            )}
          >
            {v === "week" ? "This week" : v === "month" ? "All month" : "Custom…"}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {dateView === "custom" && (
        <div className="surface-1 rounded-2xl p-4 grid grid-cols-2 gap-3 animate-fade-in">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">From</p>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }}
              className="w-full h-9 bg-muted rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">To</p>
            <input
              type="date"
              value={customTo}
              onChange={(e) => { setCustomTo(e.target.value); setPage(1); }}
              className="w-full h-9 bg-muted rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t.income.searchPlaceholder}
          className="w-full h-10 surface-1 rounded-xl pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        <button
          onClick={() => { setSelectedCategory("all"); setPage(1); }}
          className={cn(
            "flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium press transition-colors",
            selectedCategory === "all" ? "bg-primary text-primary-foreground" : "surface-1 text-muted-foreground hover:text-foreground"
          )}
        >
          {t.expenses.all}
        </button>
        {incomeCategories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium press transition-colors",
              selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "surface-1 text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{cat.icon}</span>
            {translateCategory(cat.name, lang).split(" ")[0]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="surface-1 rounded-2xl divide-y divide-border overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)}
        </div>
      ) : !transactions.length ? (
        <div className="surface-1 rounded-2xl p-10 text-center">
          <span className="text-4xl block mb-3">💼</span>
          <p className="font-semibold">{t.income.notFound}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {search ? t.income.tryDifferent : t.income.addPrompt}
          </p>
          {!search && (
            <button
              onClick={() => openAddTransaction("income")}
              className="inline-flex items-center gap-2 bg-income text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-income/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.income.addBtn}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([date, txns]) => (
            <TransactionGroup
              key={date}
              date={date}
              transactions={txns}
              currency={user?.currency}
              onEdit={openEditTransaction}
              onDelete={deleteTransaction}
              onTap={openViewTransaction}
            />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl surface-1 text-sm disabled:opacity-40 hover:bg-accent transition-colors press"
          >
            {t.income.previous}
          </button>
          <span className="text-sm text-muted-foreground">{page} / {meta.totalPages}</span>
          <button
            disabled={page === meta.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl surface-1 text-sm disabled:opacity-40 hover:bg-accent transition-colors press"
          >
            {t.income.next}
          </button>
        </div>
      )}

      <button
        onClick={() => openAddTransaction("income")}
        className="fixed right-4 bottom-20 md:bottom-6 z-40 w-14 h-14 rounded-full bg-income text-white shadow-glow-income flex items-center justify-center hover:bg-income/90 transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
    </PullToRefresh>
  );
}
