"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { gcToEthiopian, ethiopianToGc, etDaysInMonth, ET_MONTHS } from "@/lib/ethiopian-calendar";
import { cn } from "@/lib/utils";

interface EthiopianDatePickerProps {
  value: string;          // yyyy-MM-dd (Gregorian) — the form field value
  onChange: (v: string) => void;
  className?: string;
}

const ET_YEAR_MIN = 2000;
const ET_YEAR_MAX = 2050;

export function EthiopianDatePicker({ value, onChange, className }: EthiopianDatePickerProps) {
  const initEt = () => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      return gcToEthiopian(new Date(y, m - 1, d));
    }
    return gcToEthiopian(new Date());
  };

  const [et, setEt] = useState(initEt);

  // Sync if the external form value changes (e.g., when editing a transaction)
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      setEt(gcToEthiopian(new Date(y, m - 1, d)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (year: number, month: number, day: number) => {
    const daysMax = etDaysInMonth(year, month);
    const clampedDay = Math.min(day, daysMax);
    const newEt = { year, month, day: clampedDay };
    setEt(newEt);
    const gc = ethiopianToGc(newEt.year, newEt.month, newEt.day);
    onChange(format(gc, "yyyy-MM-dd"));
  };

  const selectClass =
    "flex-1 h-11 bg-muted rounded-xl px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-center";

  const years = Array.from({ length: ET_YEAR_MAX - ET_YEAR_MIN + 1 }, (_, i) => ET_YEAR_MIN + i);
  const days = Array.from({ length: etDaysInMonth(et.year, et.month) }, (_, i) => i + 1);

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Day */}
      <select
        value={et.day}
        onChange={(e) => update(et.year, et.month, Number(e.target.value))}
        className={selectClass}
      >
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Month */}
      <select
        value={et.month}
        onChange={(e) => update(et.year, Number(e.target.value), et.day)}
        className={cn(selectClass, "flex-[2]")}
      >
        {ET_MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={et.year}
        onChange={(e) => update(Number(e.target.value), et.month, et.day)}
        className={selectClass}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
