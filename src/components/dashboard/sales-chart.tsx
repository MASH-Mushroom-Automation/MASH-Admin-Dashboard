"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStore } from "../../store/dashboardStore";

export default function SalesChart() {
  const { sales, loading } = useDashboardStore();

  if (loading.sales)
    return <div className="h-[300px] animate-pulse bg-muted/20 rounded" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={sales ?? []}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" stroke="var(--muted-foreground)" />
        <YAxis stroke="var(--muted-foreground)" />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: `1px solid var(--border)`,
            borderRadius: "8px",
          }}
          formatter={(value) => `₱${Number(value).toLocaleString()}`}
        />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
