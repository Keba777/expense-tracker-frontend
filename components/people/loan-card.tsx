"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useDateFormat } from "@/lib/use-date-format";
import { cn } from "@/lib/utils";
import type { LoanWithBalance } from "@/types";

const ACTION_W = 140;
const SNAP_MID = -(ACTION_W / 2);

interface LoanCardProps {
  loan: LoanWithBalance;
  currency?: string;
  onEdit?: (l: LoanWithBalance) => void;
  onDelete?: (id: string) => void;
  onTap?: (l: LoanWithBalance) => void;
}

const statusStyles: Record<LoanWithBalance["status"], string> = {
  outstanding: "bg-expense/15 text-expense",
  partially_paid: "bg-amber-500/15 text-amber-500",
  settled: "bg-income/15 text-income",
};

export function LoanCard({ loan, currency = "USD", onEdit, onDelete, onTap }: LoanCardProps) {
  const t = useT();
  const { formatDate } = useDateFormat();

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

  const cardRef = useRef<HTMLDivElement>(null);
  const snapPos = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDir = useRef<"h" | "v" | null>(null);
  const touchHandled = useRef(false);
  const [offset, setOffset] = useState(0);
  const [sliding, setSliding] = useState(false);

  const isSettled = loan.status === "settled";
  const hasActions = !!(onEdit || onDelete);
  const canTap = !!onTap && !isSettled;

  useEffect(() => {
    if (!hasActions) return;
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id !== loan.id && snapPos.current !== 0) {
        snapPos.current = 0;
        setOffset(0);
        setSliding(true);
      }
    };
    window.addEventListener("loan-card-open", handler);
    return () => window.removeEventListener("loan-card-open", handler);
  }, [hasActions, loan.id]);

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
    window.dispatchEvent(new CustomEvent("loan-card-open", { detail: { id: loan.id } }));
  };

  const closeCard = () => {
    snapPos.current = 0;
    setOffset(0);
    setSliding(true);
  };

  const needsTracking = hasActions || canTap;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!needsTracking) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDir.current = null;
    setSliding(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!needsTracking) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = Math.abs(touch.clientY - touchStartY.current);

    if (touchDir.current === null) {
      if (Math.abs(dx) > 8 || dy > 8) {
        touchDir.current = Math.abs(dx) > dy ? "h" : "v";
      }
      return;
    }
    if (touchDir.current === "v") return;

    if (!hasActions) return;
    const raw = snapPos.current + dx;
    const clamped = Math.max(-ACTION_W - 8, Math.min(8, raw));
    setOffset(clamped);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!needsTracking) return;
    if (touchDir.current === null && canTap) {
      touchHandled.current = true;
      setTimeout(() => { touchHandled.current = false; }, 500);
      onTap!(loan);
      return;
    }
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

  const handleClick = useCallback(() => {
    if (touchHandled.current || !canTap) return;
    onTap?.(loan);
  }, [onTap, loan, canTap]);

  return (
    <div className="relative overflow-hidden select-none">
      {hasActions && (
        <div className="absolute right-0 top-0 bottom-0 flex" style={{ width: ACTION_W }}>
          {onEdit && (
            <button
              onClick={() => { closeCard(); onEdit(loan); }}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-primary text-white active:opacity-80 transition-opacity"
            >
              <Pencil className="w-4 h-4" />
              <span className="text-[10px] font-semibold tracking-wide">{t.transaction.editAction}</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => { closeCard(); onDelete(loan.id); }}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-expense text-white active:opacity-80 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-[10px] font-semibold tracking-wide">{t.transaction.deleteAction}</span>
            </button>
          )}
        </div>
      )}

      <div
        ref={cardRef}
        className={cn(
          "relative z-10 flex items-center gap-3 bg-card p-4",
          sliding && "transition-transform duration-200 ease-out",
          canTap && "cursor-pointer",
          canTap && !hasActions && "active:bg-accent/40"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg",
            loan.direction === "lent" ? "bg-income/15" : "bg-expense/15"
          )}
        >
          {loan.direction === "lent" ? "↗️" : "↙️"}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{loan.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", statusStyles[loan.status])}>
              {t.lending[loan.status === "outstanding" ? "outstanding" : loan.status === "partially_paid" ? "partiallyPaid" : "settled"]}
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(loan.date)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className={cn("text-sm font-semibold num", loan.direction === "lent" ? "text-income" : "text-expense")}>
              {formatCurrency(isSettled ? loan.amount : loan.remainingAmount, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isSettled ? t.lending.paid : t.lending.remaining}
            </p>
          </div>

          {hasActions && (
            <div className="relative hidden md:block" ref={menuRef}>
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
                      onClick={() => { setMenuOpen(false); onEdit(loan); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.transaction.editAction}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(loan.id); }}
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
