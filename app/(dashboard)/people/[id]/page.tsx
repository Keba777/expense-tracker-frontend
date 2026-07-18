"use client";

import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useT } from "@/lib/i18n";
import { peopleApi } from "@/lib/api/people";
import { loansApi } from "@/lib/api/loans";
import { LoanCard } from "@/components/people/loan-card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { LoanWithBalance } from "@/types";

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { openAddLoan, openEditLoan, openAddPayment } = useUIStore();
  const t = useT();

  const { data: person, isLoading: personLoading } = useQuery({
    queryKey: ["people", id],
    queryFn: () => peopleApi.getById(id),
  });

  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ["loans", { personId: id }],
    queryFn: () => loansApi.list({ personId: id, perPage: 100 }),
  });

  const { mutate: deleteLoan } = useMutation({
    mutationFn: loansApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans", { personId: id }] });
      qc.invalidateQueries({ queryKey: ["people"] });
    },
  });

  const loans = (loansData?.data ?? []).slice().sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === "settled") return 1;
    if (b.status === "settled") return -1;
    return 0;
  });

  const isPositive = (person?.netBalance ?? 0) >= 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/people")}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-accent press"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold truncate">{person?.name ?? "…"}</h1>
      </div>

      {personLoading ? (
        <div className="surface-1 rounded-2xl p-6 h-32 animate-pulse" />
      ) : person ? (
        <div className="surface-1 rounded-2xl p-5">
          {person.phone && <p className="text-sm text-muted-foreground mb-3">{person.phone}</p>}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-income/10 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{t.lending.totalLent}</p>
              <p className="text-lg font-bold text-income">{formatCurrency(person.totalLent, user?.currency)}</p>
            </div>
            <div className="bg-expense/10 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{t.lending.totalBorrowed}</p>
              <p className="text-lg font-bold text-expense">{formatCurrency(person.totalBorrowed, user?.currency)}</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">{t.lending.netBalance}</p>
            <p className={cn("text-2xl font-bold num", isPositive ? "text-income" : "text-expense")}>
              {formatCurrency(Math.abs(person.netBalance), user?.currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {person.netBalance === 0 ? t.lending.noOutstanding : isPositive ? t.lending.owesYou : t.lending.youOwe}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t.lending.loans}</p>
        <button
          onClick={() => openAddLoan("lent", id)}
          className="flex items-center gap-1.5 bg-primary/15 text-primary text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-primary/25 press transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.lending.addLoan}
        </button>
      </div>

      {loansLoading ? (
        <div className="surface-1 rounded-2xl divide-y divide-border overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 h-16 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : !loans.length ? (
        <div className="surface-1 rounded-2xl p-10 text-center">
          <span className="text-4xl block mb-3">📄</span>
          <p className="font-semibold">{t.lending.noLoans}</p>
        </div>
      ) : (
        <div className="surface-1 rounded-2xl overflow-hidden divide-y divide-border">
          {loans.map((loan: LoanWithBalance) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              currency={user?.currency}
              onEdit={openEditLoan}
              onDelete={deleteLoan}
              onTap={openAddPayment}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => openAddLoan("lent", id)}
        className="fixed right-4 bottom-20 md:bottom-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
