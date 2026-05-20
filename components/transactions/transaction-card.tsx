"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

interface TransactionCardProps {
  transaction: Transaction;
  currency?: string;
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function TransactionCard({ transaction, currency = "USD", compact = false, onEdit, onDelete }: TransactionCardProps) {
  const isIncome = transaction.type === "income";
  const cat = transaction.category;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const hasActions = onEdit || onDelete;

  return (
    <div
      className={cn(
        "flex items-center gap-3 transition-all",
        !compact && "p-4 hover:bg-accent/50"
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
          {cat?.name ?? (isIncome ? t.balance.income : t.balance.expenses)} · {formatDate(transaction.date)}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
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

        {hasActions && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 min-w-[130px] bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                {onEdit && (
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(transaction); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    {t.transaction.editAction}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(transaction.id); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-expense/10 text-expense transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.transaction.deleteAction}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TransactionGroupProps {
  date: string;
  transactions: Transaction[];
  currency?: string;
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionGroup({ date, transactions, currency, onEdit, onDelete }: TransactionGroupProps) {
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
          <TransactionCard key={t.id} transaction={t} currency={currency} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
