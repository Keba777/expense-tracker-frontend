"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { format } from "date-fns";
import { formatCompact } from "@/lib/utils";
import { ChartSkeleton } from "@/components/ui/skeleton";
import type { MonthlyTrend } from "@/types";

interface TrendLineProps {
  data?: MonthlyTrend[];
  isLoading?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-1 rounded-xl px-3 py-2 shadow-card text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "income" ? "Income" : "Expense"}: ${formatCompact(p.value)}
        </p>
      ))}
    </div>
  );
};

export function TrendLine({ data = [], isLoading }: TrendLineProps) {
  if (isLoading) return <ChartSkeleton />;

  const chartData = data.map((d) => ({
    name: MONTHS[d.month - 1],
    income: d.income,
    expense: d.expense,
  }));

  return (
    <div className="surface-1 rounded-2xl p-5">
      <p className="text-sm font-semibold mb-0.5">Income vs Expenses</p>
      <p className="text-xs text-muted-foreground mb-4">Last 6 months trend</p>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${formatCompact(v)}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} name="income" />
          <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2} fill="url(#expenseGrad)" dot={false} name="expense" />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-income" />
          <span className="text-xs text-muted-foreground">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-expense" />
          <span className="text-xs text-muted-foreground">Expenses</span>
        </div>
      </div>
    </div>
  );
}
