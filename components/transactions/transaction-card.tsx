"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

interface TransactionCardProps {
  transaction: Transaction;
  currency?: string;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function TransactionCard({ transaction, currency = "USD", compact = false }: TransactionCardProps) {
  const isIncome = transaction.type === "income";
  const cat = transaction.category;

  return (
    <div
      className={cn(
        "flex items-center gap-3 transition-all",
        !compact && "p-4 hover:bg-accent/50 rounded-xl cursor-pointer"
      )}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ backgroundColor: cat?.color ? `${cat.color}25` : undefined }}
      >
        {cat?.icon ?? (isIncome ? "💰" : "💸")}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.description}</p>
        <p className="text-xs text-muted-foreground">
          {cat?.name ?? (isIncome ? "Income" : "Expense")} · {formatDate(transaction.date)}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            isIncome ? "text-income" : "text-expense"
          )}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount, currency)}
        </p>
        {transaction.recurrence !== "once" && (
          <p className="text-[10px] text-muted-foreground capitalize">{transaction.recurrence}</p>
        )}
      </div>
    </div>
  );
}

interface TransactionGroupProps {
  date: string;
  transactions: Transaction[];
  currency?: string;
}

export function TransactionGroup({ date, transactions, currency }: TransactionGroupProps) {
  const dayTotal = transactions.reduce((sum, t) => {
    return sum + (t.type === "income" ? t.amount : -t.amount);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {formatDate(date)}
        </span>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            dayTotal >= 0 ? "text-income" : "text-expense"
          )}
        >
          {dayTotal >= 0 ? "+" : ""}{formatCurrency(Math.abs(dayTotal), currency)}
        </span>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {transactions.map((t) => (
          <TransactionCard key={t.id} transaction={t} currency={currency} />
        ))}
      </div>
    </div>
  );
}
