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
import { useDashboardStore } from "../../store/dashboardStore";

const weeklyData = [
  { label: "Mon", sales: 2400 },
  { label: "Tue", sales: 1398 },
  { label: "Wed", sales: 9800 },
  { label: "Thu", sales: 3908 },
  { label: "Fri", sales: 0 },
  { label: "Sat", sales: 0 },
  { label: "Sun", sales: 0 },
];

// Helper to produce data for different periods. For now we simulate monthly/yearly data.
function getDataForPeriod(period: string) {
  switch (period) {
    case "daily":
      // return only today (last day of weeklyData)
      return [
        {
          day: weeklyData[weeklyData.length - 1].label,
          sales: weeklyData[weeklyData.length - 1].sales,
        },
      ];
    case "weekly":
      return weeklyData.map((d) => ({ day: d.label, sales: d.sales }));
    case "monthly":
      // aggregate into 4 weeks (weeks 1-4)
      const month = [
        { day: "Week 1", sales: 2400 + 1398 + 9800 },
        { day: "Week 2", sales: 3908 + 4800 + 3800 },
        { day: "Week 3", sales: 4300 + 2400 + 1398 },
        { day: "Week 4", sales: 9800 + 3908 + 4800 },
      ];
      return month;
    case "yearly":
      // simulate 12 months
      return [
        { day: "Jan", sales: 34000 },
        { day: "Feb", sales: 28000 },
        { day: "Mar", sales: 39000 },
        { day: "Apr", sales: 45000 },
        { day: "May", sales: 38000 },
        { day: "Jun", sales: 42000 },
        { day: "Jul", sales: 47000 },
        { day: "Aug", sales: 43000 },
        { day: "Sep", sales: 41000 },
        { day: "Oct", sales: 48000 },
        { day: "Nov", sales: 50000 },
        { day: "Dec", sales: 52000 },
      ];
    default:
      return weeklyData.map((d) => ({ day: d.label, sales: d.sales }));
  }
}

export default function ECommerceSection() {
  const [period, setPeriod] = useState<string>("weekly");
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  const displayData = useMemo(() => getDataForPeriod(period), [period]);

  const totalSales = useMemo(
    () =>
      displayData.reduce(
        (sum: number, item: any) => sum + (item.sales || 0),
        0
      ),
    [displayData]
  );

  const totalOrders = displayData.length;
  const todaySales = displayData[displayData.length - 1]?.sales ?? 0;

  const { sales, loading } = useDashboardStore();

  // Summary numbers should not be affected by the chart filter — keep summary fixed (monthly)
  const summaryData = useMemo(() => getDataForPeriod("monthly"), []);
  const summaryTotalSales = useMemo(
    () =>
      summaryData.reduce(
        (sum: number, item: any) => sum + (item.sales || 0),
        0
      ),
    [summaryData]
  );
  const summaryTotalOrders = summaryData.length;
  const summaryTodaySales = summaryData[summaryData.length - 1]?.sales ?? 0;

  const titleMap: Record<string, string> = {
    // daily: "Daily Sales",
    weekly: "Weekly Sales",
    monthly: "Monthly Sales",
    yearly: "Yearly Sales",
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ---------- Sales Summary (visible for all periods) ---------- */}
      <Card className="border-1 shadow-sm">
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
            <DropdownMenu onOpenChange={(open) => setFilterOpen(open)}>
              <DropdownMenuTrigger>
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
