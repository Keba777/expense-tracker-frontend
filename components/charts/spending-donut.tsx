"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryTotal } from "@/types";

interface SpendingDonutProps {
  data?: CategoryTotal[];
  isLoading?: boolean;
  currency?: string;
}

const CustomTooltip = ({ active, payload, currency }: { active?: boolean; payload?: any[]; currency?: string }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as CategoryTotal;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-card text-sm">
      <p className="font-medium">{entry.categoryIcon} {entry.categoryName}</p>
      <p className="text-muted-foreground">{formatCurrency(entry.total, currency)}</p>
      <p className="text-xs text-muted-foreground">{entry.percentage.toFixed(1)}%</p>
    </div>
  );
};

export function SpendingDonut({ data = [], isLoading, currency = "USD" }: SpendingDonutProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="flex items-center justify-center h-40">
          <div className="w-36 h-36 rounded-full bg-muted skeleton" />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-sm font-semibold mb-1">Spending Breakdown</p>
        <p className="text-xs text-muted-foreground mb-4">This month by category</p>
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-sm text-muted-foreground">No expenses yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm font-semibold mb-0.5">Spending Breakdown</p>
      <p className="text-xs text-muted-foreground mb-4">This month by category</p>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="total"
            animationBegin={0}
            animationDuration={600}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.categoryColor} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-2">
        {data.slice(0, 5).map((item) => (
          <div key={item.categoryId} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.categoryColor }}
            />
            <span className="text-xs flex-1 truncate text-muted-foreground">
              {item.categoryIcon} {item.categoryName}
            </span>
            <span className="text-xs font-medium tabular-nums">
              {item.percentage.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(item.total, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
