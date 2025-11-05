// "use client";

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const salesData = [
//   { day: "Mon", sales: 2400 },
//   { day: "Tue", sales: 1398 },
//   { day: "Wed", sales: 9800 },
//   { day: "Thu", sales: 3908 },
//   { day: "Fri", sales: 4800 },
//   { day: "Sat", sales: 3800 },
//   { day: "Sun", sales: 4300 },
// ];

// // Dynamic calculations
// const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
// const totalOrders = salesData.length; // or use real order count
// const todaySales = salesData[salesData.length - 1].sales; // Last day = today

// export default function ECommerceSection() {
//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//       {/* ---------- Sales Summary ---------- */}
//       <Card className="border-1 shadow-sm">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-lg font-semibold text-foreground">
//             Sales Summary
//           </CardTitle>
//           <CardDescription>
//             Today&apos;s performance
//           </CardDescription>
//         </CardHeader>

//         <CardContent className="space-y-5 pt-2">
//           {/* Total Sales */}
//           <div className="text-center">
//             <p className="text-4xl font-bold text-primary tracking-tight">
//               ₱{totalSales.toLocaleString()}
//             </p>
//             <p className="text-xs text-muted-foreground mt-1 font-medium">
//               Total Sales this month
//             </p>
//           </div>

//           {/* Divider */}
//           <div className="h-px bg-border/60" />

//           {/* Mini Stats */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="bg-muted/40 rounded-lg p-3 text-center border border-border/30">
//               <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
//               <p className="text-xs text-muted-foreground mt-0.5">Orders</p>
//             </div>
//             <div className="bg-muted/40 rounded-lg p-3 text-center border border-border/30">
//               <p className="text-2xl font-bold text-foreground">
//                 ₱{todaySales.toLocaleString()}
//               </p>
//               <p className="text-xs text-muted-foreground mt-0.5">Today</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* ---------- Daily Sales Chart ---------- */}
//       <Card className="lg:col-span-2 border-1 shadow-sm">
//         <CardHeader className="pb-3">
//           <CardTitle className="text-lg font-semibold text-foreground">
//             Daily Sales
//           </CardTitle>
//           <CardDescription>
//             Sales performance over the last week
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           <ResponsiveContainer width="100%" height={200}>
//             <BarChart
//               data={salesData}
//               margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
//             >
//               <defs>
//                 <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="50%" stopColor="#58B33A" stopOpacity={0.9} />
//                   <stop offset="100%" stopColor="#2E5E4E" stopOpacity={0.4} />
//                 </linearGradient>
//               </defs>

//               <CartesianGrid
//                 strokeDasharray="4 4"
//                 stroke="#f1f5f9"
//                 vertical={false}
//               />
//               <XAxis
//                 dataKey="day"
//                 tick={{ fill: "#64748b", fontSize: 12 }}
//                 axisLine={false}
//               />
//               <YAxis
//                 tick={{ fill: "#64748b", fontSize: 12 }}
//                 axisLine={false}
//                 tickFormatter={(v) => `₱${v / 1000}k`}
//               />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: "#fff",
//                   border: "1px solid #e2e8f0",
//                   borderRadius: "8px",
//                   fontSize: "13px",
//                 }}
//                 formatter={(v: number) => `₱${v.toLocaleString()}`}
//               />
//               <Bar
//                 dataKey="sales"
//                 fill="url(#barGradient)"
//                 radius={[8, 8, 0, 0]}
//                 barSize={36}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStore } from "../../../store/dashboardStore";

export default function ECommerceSection() {
  const { sales, loading } = useDashboardStore();

  // Fallback while loading
  if (loading.sales) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="animate-pulse">
          <CardContent className="h-48" />
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="h-48" />
        </Card>
      </div>
    );
  }

  const totalSales = sales?.reduce((s, i) => s + i.sales, 0) ?? 0;
  const todaySales = sales?.[sales.length - 1]?.sales ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sales Summary */}
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

      {/* Daily Sales Chart */}
      <Card className="lg:col-span-2 border-1 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">
            Daily Sales
          </CardTitle>
          <CardDescription>
            Sales performance over the last week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={sales ?? []}
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
