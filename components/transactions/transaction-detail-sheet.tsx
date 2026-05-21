"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Pencil, Trash2, Calendar, RefreshCw, FileText, Tag } from "lucide-react";
import { format } from "date-fns";
import { transactionsApi } from "@/lib/api/transactions";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useT } from "@/lib/i18n";
import { formatCurrency, cn } from "@/lib/utils";

export function TransactionDetailSheet() {
  const qc = useQueryClient();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const { viewingTransaction, closeViewTransaction, openEditTransaction } = useUIStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { mutate: deleteTransaction, isPending } = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      closeViewTransaction();
    },
  });

  if (!viewingTransaction) return null;

  const tx = viewingTransaction;
  const isIncome = tx.type === "income";
  const cat = tx.category;

  const handleEdit = () => {
    closeViewTransaction();
    openEditTransaction(tx);
  };

  const handleDeleteConfirm = () => {
    if (confirmingDelete) {
      deleteTransaction(tx.id);
    } else {
      setConfirmingDelete(true);
    }
  };

  const handleClose = () => {
    setConfirmingDelete(false);
    closeViewTransaction();
  };

  let displayDate = tx.date;
  try {
    displayDate = format(new Date(tx.date.slice(0, 10) + "T00:00:00"), "MMMM d, yyyy");
  } catch {}

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl animate-slide-up rounded-t-3xl md:rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-lg font-semibold">{t.transaction.details}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Hero: icon + category + amount */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: cat?.color ? `${cat.color}25` : undefined }}
            >
              {cat?.icon ?? (isIncome ? "💰" : "💸")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {cat?.name ?? (isIncome ? "Income" : "Expense")}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  isIncome ? "text-income" : "text-expense"
                )}
              >
                {isIncome ? "+" : "-"}{formatCurrency(tx.amount, user?.currency)}
              </p>
            </div>
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                isIncome
                  ? "bg-income/15 text-income"
                  : "bg-expense/15 text-expense"
              )}
            >
              {isIncome ? t.transaction.income.replace("💰 ", "") : t.transaction.expense.replace("💸 ", "")}
            </span>
          </div>

          {/* Description */}
          <div className="bg-muted rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t.transaction.description}</p>
                <p className="text-sm font-medium">{tx.description}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t.transaction.date}</p>
                <p className="text-sm font-medium">{displayDate}</p>
              </div>
            </div>

            {tx.recurrence !== "once" && (
              <div className="flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t.transaction.repeat}</p>
                  <p className="text-sm font-medium capitalize">{tx.recurrence}</p>
                </div>
              </div>
            )}

            {tx.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 opacity-60" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t.transaction.notes.replace(" (optional)", "").replace(" (አማራጭ)", "")}</p>
                  <p className="text-sm text-muted-foreground">{tx.notes}</p>
                </div>
              </div>
            )}

            {tx.tags && tx.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tx.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-accent text-foreground px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleEdit}
              className="h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              {t.transaction.editAction}
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className={cn(
                "h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60",
                confirmingDelete
                  ? "bg-expense text-white"
                  : "bg-expense/10 text-expense hover:bg-expense/20"
              )}
            >
              <Trash2 className="w-4 h-4" />
              {confirmingDelete ? t.transaction.confirmDelete : t.transaction.deleteAction}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
