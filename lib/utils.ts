import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toFixed(2);
}

/** Returns { code, amount } for compact card display.
 *  e.g. ETB 1,234,567 → { code: "ETB", amount: "1.2M" }
 *       USD 45.99     → { code: "$",   amount: "45.99" }
 */
export function formatCurrencyCompact(
  amount: number,
  currency = "USD"
): { code: string; amount: string } {
  // Extract symbol/code by formatting 0 and stripping the digit
  const sample = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(0);
  const code = sample.replace(/[\d,.\s]/g, "").trim() || currency;

  const abs = Math.abs(amount);
  let compact: string;
  if (abs >= 1_000_000_000) {
    compact = `${(amount / 1_000_000_000).toFixed(1)}B`;
  } else if (abs >= 1_000_000) {
    compact = `${(amount / 1_000_000).toFixed(1)}M`;
  } else if (abs >= 1_000) {
    compact = `${(amount / 1_000).toFixed(1)}K`;
  } else {
    compact = amount.toFixed(2);
  }

  return { code, amount: compact };
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d");
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

export function groupTransactionsByDate<T extends { date: string }>(
  transactions: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const t of transactions) {
    const key = t.date.split("T")[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }
  return grouped;
}

export function getWeekDates(from?: Date): { from: string; to: string } {
  const now = from ?? new Date();
  const weekday = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - weekday + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: format(monday, "yyyy-MM-dd"),
    to: format(sunday, "yyyy-MM-dd"),
  };
}

export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
