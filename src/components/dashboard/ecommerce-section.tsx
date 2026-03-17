"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboardSales } from "@/hooks/useDashboardData";

type ChartPoint = {
  day: string;
  sales: number;
};

export default function ECommerceSection() {
  const [period, setPeriod] = useState<string>("weekly");
  const daysMap: Record<string, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    yearly: 365,
  };
  const { data: sales } = useDashboardSales(daysMap[period] || 7);

  // Use real data from store, or empty array as fallback
  const displayData = useMemo<ChartPoint[]>(() => {
    if (!sales || sales.length === 0) {
      console.log(
        "[ECommerceSection] No sales data available, showing empty chart",
      );
      return [];
    }
    console.log("[ECommerceSection] Using real sales data:", sales);
    return sales;
  }, [sales]);

  const totalSales = useMemo(
    () =>
      displayData.reduce(
        (sum: number, item: ChartPoint) => sum + (item.sales || 0),
        0,
      ),
    [displayData],
  );

  const todaySales = displayData[displayData.length - 1]?.sales ?? 0;

  // Summary numbers should not be affected by the chart filter — keep summary fixed (monthly)

  const titleMap: Record<string, string> = {
    // daily: "Daily Sales",
    weekly: "Weekly Sales",
    monthly: "Monthly Sales",
    yearly: "Yearly Sales",
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ---------- Sales Summary (visible for all periods) ---------- */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle>Sales Summary</CardTitle>
          <CardDescription>Today&apos;s performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <div className="text-center">
            <p className="sm:text-4xl text-2xl font-bold text-primary tracking-tight">
              ₱{totalSales.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Total Sales this month
            </p>
          </div>
          <div className="h-px bg-border/60" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/40 rounded-lg p-3 text-center border border-border/30">
              <p className="text-2xl font-bold text-foreground">
                {sales?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Orders</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-center border border-border/30">
              <p className="text-2xl font-bold text-foreground">
                ₱{todaySales.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Daily Sales Chart ---------- */}
      <Card className="lg:col-span-2 border shadow-sm">
        <CardHeader className="pb-3 flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {titleMap[period] ?? "Sales"}
            </CardTitle>
            <CardDescription>
              Sales performance for the selected period
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" aria-label="Filter">
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={period}
                  onValueChange={(v) => setPeriod(v)}
                >
                  {/* <DropdownMenuRadioItem value="daily">Daily</DropdownMenuRadioItem> */}
                  <DropdownMenuRadioItem value="weekly">
                    Weekly
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="monthly">
                    Monthly
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="yearly">
                    Yearly
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={displayData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="50%" stopColor="#58B33A" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#2E5E4E" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
                tickFormatter={(v) => `₱${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(v: number) => `₱${v.toLocaleString()}`}
              />
              <Bar
                dataKey="sales"
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                barSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
