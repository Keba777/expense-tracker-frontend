"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { HandCoins, ChevronRight } from "lucide-react";
import { peopleApi } from "@/lib/api/people";
import { useT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

interface LendingSummaryCardProps {
  currency?: string;
}

export function LendingSummaryCard({ currency = "USD" }: LendingSummaryCardProps) {
  const router = useRouter();
  const t = useT();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["people"],
    queryFn: peopleApi.list,
  });

  const totalLent = people.reduce((sum, p) => sum + p.totalLent, 0);
  const totalBorrowed = people.reduce((sum, p) => sum + p.totalBorrowed, 0);

  if (!isLoading && totalLent === 0 && totalBorrowed === 0) return null;

  return (
    <button
      onClick={() => router.push("/people")}
      className="w-full surface-1 rounded-2xl p-4 flex items-center gap-3 hover:bg-accent/40 transition-colors press text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
        <HandCoins className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{t.lending.totalLent}</p>
          <p className="text-sm font-bold text-income num">{formatCurrency(totalLent, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.lending.totalBorrowed}</p>
          <p className="text-sm font-bold text-expense num">{formatCurrency(totalBorrowed, currency)}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
