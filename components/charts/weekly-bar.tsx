"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from "recharts";
import { formatCompact } from "@/lib/utils";
import { ChartSkeleton } from "@/components/ui/skeleton";
import type { DailyTotal } from "@/types";
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";

interface WeeklyBarProps {
  data?: DailyTotal[];
  isLoading?: boolean;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-1 rounded-xl px-3 py-2 shadow-card text-xs space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name === "expense" ? "Spent" : "Earned"}: ${formatCompact(p.value)}
        </p>
      ))}
    </div>
  );
};

export function WeeklyBar({ data = [], isLoading }: WeeklyBarProps) {
  if (isLoading) return <ChartSkeleton />;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const chartData = days.map((day, i) => {
    const key = format(day, "yyyy-MM-dd");
    const found = data.find((d) => d.date.startsWith(key));
    return {
      name: DAY_LABELS[i],
      expense: found?.expense ?? 0,
      income: found?.income ?? 0,
      isToday: format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd"),
    };
  });

  return (
    <div className="surface-1 rounded-2xl p-5">
      <p className="text-sm font-semibold mb-0.5">This Week</p>
      <p className="text-xs text-muted-foreground mb-4">Daily spending overview</p>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${formatCompact(v)}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="expense" name="expense" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isToday ? "#8B5CF6" : "#F43F5E"}
                fillOpacity={entry.isToday ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
