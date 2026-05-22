"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { TransactionGroup } from "./transaction-card";
import { TransactionSkeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { transactionsApi } from "@/lib/api/transactions";
import { groupTransactionsByDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const PER_PAGE = 30;

export function AllTransactionsSheet() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const { isAllTransactionsOpen, closeAllTransactions, openViewTransaction } = useUIStore();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["transactions", { page, perPage: PER_PAGE }],
    queryFn: () => transactionsApi.list({ page, perPage: PER_PAGE }),
    enabled: isAllTransactionsOpen,
  });

  useQuery({
    queryKey: ["transactions", { page: page + 1, perPage: PER_PAGE }],
    queryFn: () => transactionsApi.list({ page: page + 1, perPage: PER_PAGE }),
    enabled: isAllTransactionsOpen && !!data && page < (data.meta.totalPages ?? 1),
  });

  if (!isAllTransactionsOpen) return null;

  const transactions = data?.data ?? [];
  const grouped = groupTransactionsByDate(transactions);
  const hasMore = data ? page < data.meta.totalPages : false;

  const handleClose = () => {
    closeAllTransactions();
    setPage(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-[hsl(var(--surface-1))] shadow-sheet animate-slide-up rounded-t-3xl md:rounded-3xl flex flex-col max-h-[90dvh]">
        <div className="md:hidden sheet-handle" />

        {/* Fixed header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0">
          <h2 className="text-lg font-semibold">{t.dashboard.recentTransactions}</h2>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-3">
          {isLoading ? (
            <div className="surface-1 rounded-2xl divide-y divide-border overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => <TransactionSkeleton key={i} />)}
            </div>
          ) : !transactions.length ? (
            <div className="py-16 text-center">
              <span className="text-4xl block mb-3">🧾</span>
              <p className="font-semibold mb-1">{t.dashboard.noTransactions}</p>
              <p className="text-sm text-muted-foreground">{t.dashboard.startTracking}</p>
            </div>
          ) : (
            <>
              {Array.from(grouped.entries()).map(([date, txns]) => (
                <TransactionGroup
                  key={date}
                  date={date}
                  transactions={txns}
                  currency={user?.currency}
                  onTap={openViewTransaction}
                />
              ))}

              {hasMore && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="w-full h-11 rounded-2xl bg-muted text-sm font-medium text-foreground flex items-center justify-center gap-2 hover:bg-muted/80 press disabled:opacity-60"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
