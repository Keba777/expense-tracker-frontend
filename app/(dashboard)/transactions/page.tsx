"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X } from "lucide-react";
import { format } from "date-fns";
import { transactionsApi, categoriesApi } from "@/lib/api/transactions";
import { TransactionGroup } from "@/components/transactions/transaction-card";
import { TransactionSkeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { groupTransactionsByDate } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useDateFormat } from "@/lib/use-date-format";
import { translateCategory } from "@/lib/category-translations";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

type DatePreset = "all" | "week" | "month" | "custom";

const PER_PAGE = 25;

function getPresetRange(preset: DatePreset): { from?: string; to?: string } {
  const now = new Date();
  if (preset === "week") {
    const dow = now.getDay() || 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - dow + 1);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: format(mon, "yyyy-MM-dd"), to: format(sun, "yyyy-MM-dd") };
  }
  if (preset === "month") {
    return {
      from: format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"),
      to: format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd"),
    };
  }
  return {};
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom…" },
];

export default function TransactionsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { openViewTransaction } = useUIStore();
  const { lang } = useDateFormat();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const presetRange = getPresetRange(datePreset);
  const from = datePreset === "custom" ? customFrom || undefined : presetRange.from;
  const to = datePreset === "custom" ? customTo || undefined : presetRange.to;

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const queryParams = {
    search: debouncedSearch || undefined,
    categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
    from,
    to,
    perPage: PER_PAGE,
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["transactions-all", queryParams],
    queryFn: ({ pageParam }) =>
      transactionsApi.list({ ...queryParams, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const allTransactions = data?.pages.flatMap((p) => p.data) ?? [];
  const grouped = groupTransactionsByDate(allTransactions);
  const totalCount = data?.pages[0]?.meta.total ?? 0;

  // Infinite scroll sentinel
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground press"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold">All Transactions</h1>
          {totalCount > 0 && (
            <p className="text-xs text-muted-foreground">{totalCount} total</p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all transactions…"
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

      {/* Date presets */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {DATE_PRESETS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDatePreset(value)}
            className={cn(
              "flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium press transition-colors",
              datePreset === value
                ? "bg-primary text-primary-foreground"
                : "surface-1 text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {datePreset === "custom" && (
        <div className="surface-1 rounded-2xl p-4 grid grid-cols-2 gap-3 animate-fade-in">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">From</p>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full h-9 bg-muted rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">To</p>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full h-9 bg-muted rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium press transition-colors",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "surface-1 text-muted-foreground hover:text-foreground"
          )}
        >
          All categories
        </button>
        {(categoriesData as Category[]).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium press transition-colors",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "surface-1 text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{cat.icon}</span>
            {translateCategory(cat.name, lang).split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {isLoading ? (
        <div className="surface-1 rounded-2xl divide-y divide-border overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      ) : !allTransactions.length ? (
        <div className="surface-1 rounded-2xl p-12 text-center">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="font-semibold">No transactions found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {Array.from(grouped.entries()).map(([date, txns]) => (
            <TransactionGroup
              key={date}
              date={date}
              transactions={txns}
              currency={user?.currency}
              onTap={openViewTransaction}
            />
          ))}

          {/* Invisible sentinel triggers next page */}
          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="surface-1 rounded-2xl divide-y divide-border overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <TransactionSkeleton key={i} />
              ))}
            </div>
          )}

          {!hasNextPage && allTransactions.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-3">
              All {totalCount} transactions loaded
            </p>
          )}
        </div>
      )}
    </div>
  );
}
