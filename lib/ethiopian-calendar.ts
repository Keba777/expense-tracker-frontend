import { isToday, isYesterday } from "date-fns";

const ET_EPOCH = 1724221; // JDN of Meskerem 1, 1 AM (Aug 27, 8 CE proleptic Gregorian)

export const ET_MONTHS = [
  "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ",
];

// ── JDN helpers ──────────────────────────────────────────────────────────────

function gregorianToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const mo = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * mo + 2) / 5) + 1;
  const month = mo + 3 - 12 * Math.floor(mo / 10);
  const year = 100 * b + d - 4800 + Math.floor(mo / 10);
  return { year, month, day };
}

// ── Core conversion ───────────────────────────────────────────────────────────

export function gcToEthiopian(date: Date): { year: number; month: number; day: number } {
  const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const D = jdn - ET_EPOCH;

  const n4 = Math.floor(D / 1461);
  let remaining = D - n4 * 1461;
  let year = n4 * 4 + 1;

  for (let i = 0; i < 4; i++) {
    const daysInYear = year % 4 === 3 ? 366 : 365;
    if (remaining >= daysInYear) {
      remaining -= daysInYear;
      year++;
    } else {
      break;
    }
  }

  const month = Math.floor(remaining / 30) + 1;
  const day = (remaining % 30) + 1;
  return { year, month, day };
}

export function ethiopianToGc(etYear: number, etMonth: number, etDay: number): Date {
  const n4 = Math.floor((etYear - 1) / 4);
  const remainingYears = etYear - 1 - n4 * 4;
  let days = n4 * 1461;
  for (let i = 0; i < remainingYears; i++) {
    const yr = n4 * 4 + 1 + i;
    days += yr % 4 === 3 ? 366 : 365;
  }
  days += (etMonth - 1) * 30 + (etDay - 1);
  const jdn = ET_EPOCH + days;
  const { year, month, day } = jdnToGregorian(jdn);
  return new Date(year, month - 1, day);
}

// ── Month helpers ─────────────────────────────────────────────────────────────

export function etDaysInMonth(etYear: number, etMonth: number): number {
  if (etMonth <= 12) return 30;
  // Pagume: 6 days in ET leap year (year % 4 === 3), else 5
  return etYear % 4 === 3 ? 6 : 5;
}

// ── Display helpers ───────────────────────────────────────────────────────────

export function formatEthiopianDate(date: Date): string {
  if (isToday(date)) return "ዛሬ";
  if (isYesterday(date)) return "ትናንት";
  const { year, month, day } = gcToEthiopian(date);
  return `${day} ${ET_MONTHS[month - 1]} ${year}`;
}

export function formatEthiopianDateShort(date: Date): string {
  const { month, day } = gcToEthiopian(date);
  return `${day} ${ET_MONTHS[month - 1]}`;
}

/** Returns the ET month/year label for the 1st day of a GC month. */
export function formatEthiopianMonthYear(gcYear: number, gcMonth: number): string {
  const { year, month } = gcToEthiopian(new Date(gcYear, gcMonth - 1, 1));
  return `${ET_MONTHS[month - 1]} ${year}`;
}
