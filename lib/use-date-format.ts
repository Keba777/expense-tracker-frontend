"use client";

import { parseISO, format, isToday, isYesterday } from "date-fns";
import { useLangStore } from "@/store/lang-store";
import {
  formatEthiopianDate,
  formatEthiopianDateShort,
  formatEthiopianMonthYear,
} from "@/lib/ethiopian-calendar";

export function useDateFormat() {
  const lang = useLangStore((s) => s.lang);

  const formatDate = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (lang === "am") return formatEthiopianDate(date);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  const formatDateShort = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (lang === "am") return formatEthiopianDateShort(date);
    return format(date, "MMM d");
  };

  const formatMonthYear = (year: number, month: number): string => {
    if (lang === "am") return formatEthiopianMonthYear(year, month);
    return format(new Date(year, month - 1, 1), "MMMM yyyy");
  };

  return { formatDate, formatDateShort, formatMonthYear, lang };
}
