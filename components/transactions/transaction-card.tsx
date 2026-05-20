"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

const ACTION_W = 140; // total width of revealed action buttons
const SNAP_MID = -(ACTION_W / 2); // midpoint — past this → snap open

interface TransactionCardProps {
  transaction: Transaction;
  currency?: string;
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function TransactionCard({
  transaction,
  currency = "USD",
  compact = false,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = transaction.type === "income";
  const cat = transaction.category;
  const t = useT();

  // ── Desktop dropdown state ─────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // ── Swipe state ────────────────────────────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const snapPos = useRef(0);          // committed position: 0 or -ACTION_W
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDir = useRef<"h" | "v" | null>(null);
  const [offset, setOffset] = useState(0);
  const [sliding, setSliding] = useState(false); // enable CSS transition

  const hasActions = !!(onEdit || onDelete) && !compact;

  // Close when another card is opened via custom event
  useEffect(() => {
    if (!hasActions) return;
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id !== transaction.id && snapPos.current !== 0) {
        snapPos.current = 0;
        setOffset(0);
        setSliding(true);
      }
    };
    window.addEventListener("tx-card-open", handler);
    return () => window.removeEventListener("tx-card-open", handler);
  }, [hasActions, transaction.id]);

  // Non-passive touchmove to prevent page scroll while swiping horizontally
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !hasActions) return;
    const handler = (e: TouchEvent) => {
      if (touchDir.current === "h") e.preventDefault();
    };
    el.addEventListener("touchmove", handler, { passive: false });
    return () => el.removeEventListener("touchmove", handler);
  }, [hasActions]);

  const openCard = () => {
    snapPos.current = -ACTION_W;
    setOffset(-ACTION_W);
    setSliding(true);
    window.dispatchEvent(
      new CustomEvent("tx-card-open", { detail: { id: transaction.id } })
    );
  };

  const closeCard = () => {
    snapPos.current = 0;
    setOffset(0);
    setSliding(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasActions) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDir.current = null;
    setSliding(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!hasActions) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = Math.abs(touch.clientY - touchStartY.current);

    // Lock direction once movement exceeds 8px
    if (touchDir.current === null) {
      if (Math.abs(dx) > 8 || dy > 8) {
        touchDir.current = Math.abs(dx) > dy ? "h" : "v";
      }
      return;
    }
    if (touchDir.current === "v") return;

    // Move card: offset is anchored to the snap position at touchstart
    const raw = snapPos.current + dx;
    const clamped = Math.max(-ACTION_W - 8, Math.min(8, raw));
    setOffset(clamped);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasActions || touchDir.current !== "h") return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const finalOffset = snapPos.current + dx;
    setSliding(true);
    if (finalOffset < SNAP_MID) {
      openCard();
    } else {
      closeCard();
    }
  };

  return (
    <div className="relative overflow-hidden select-none">
      {/* ── Action buttons (revealed behind the card) ────────────────────── */}
      {hasActions && (
        <div
          className="absolute right-0 top-0 bottom-0 flex"
          style={{ width: ACTION_W }}
        >
          {onEdit && (
            <button
              onClick={() => {
                closeCard();
                onEdit(transaction);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-primary text-white active:opacity-80 transition-opacity"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-[10px] font-semibold tracking-wide">
                {t.transaction.editAction}
              </span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                closeCard();
                onDelete(transaction.id);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-expense text-white active:opacity-80 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-[10px] font-semibold tracking-wide">
                {t.transaction.deleteAction}
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── Card content (slides over action buttons) ────────────────────── */}
      <div
        ref={cardRef}
        className={cn(
          "relative z-10 flex items-center gap-3 bg-card",
          !compact && "p-4",
          sliding && "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Category icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ backgroundColor: cat?.color ? `${cat.color}25` : undefined }}
        >
          {cat?.icon ?? (isIncome ? "💰" : "💸")}
        </div>

        {/* Description + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{transaction.description}</p>
          <p className="text-xs text-muted-foreground">
            {cat?.name ?? (isIncome ? t.balance.income : t.balance.expenses)} ·{" "}
            {formatDate(transaction.date)}
          </p>
        </div>

        {/* Amount + desktop menu */}
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
              <p className="text-[10px] text-muted-foreground capitalize">
                {transaction.recurrence}
              </p>
            )}
          </div>

          {/* Desktop-only ··· menu — hidden on touch/mobile */}
          {hasActions && (
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 min-w-[130px] bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                  {onEdit && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(transaction);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.transaction.editAction}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(transaction.id);
                      }}
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

export function TransactionGroup({
  date,
  transactions,
  currency,
  onEdit,
  onDelete,
}: TransactionGroupProps) {
  const dayTotal = transactions.reduce(
    (sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
    0
  );

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
          {dayTotal >= 0 ? "+" : ""}
          {formatCurrency(Math.abs(dayTotal), currency)}
        </span>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {transactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            currency={currency}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
