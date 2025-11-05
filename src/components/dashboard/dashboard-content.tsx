// "use client"

// import type React from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { AlertCircle, Users, Package, Warehouse, ArrowRight } from "lucide-react"
// import ChamberInventorySection from "../dashboard/sections/chamber-inventory"
// import ECommerceSection from "../dashboard/sections/ecommerce-section"

// export default function DashboardContent() {
//   return (
//     <div className="p-6 md:p-8 space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-primary">Welcome Back!</h1>
//         <p className="text-muted-foreground mt-1 mb-5">
//           Discover the latest updates in your business today.
//         </p>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ">
//           <StatCard
//             title="Chambers"
//             primaryValue="420"
//             primaryLabel="Active"
//             secondaryValue="45"
//             secondaryLabel="Inactive"
//             icon={<Warehouse className="w-5 h-5" />}
//           />
//           <StatCard
//             title="Orders"
//             primaryValue="10k"
//             primaryLabel="Completed"
//             secondaryValue="200"
//             secondaryLabel="Pending"
//             icon={<Users className="w-5 h-5" />}
//           />
//           <StatCard
//             title="Products"
//             primaryValue="900"
//             primaryLabel="Pending"
//             secondaryValue="300"
//             secondaryLabel="Approved"
//             icon={<Package className="w-5 h-5" />}
//           />
//           <StatCard
//             title=" Seller Applications"
//             primaryValue="10"
//             primaryLabel="Pending"
//             secondaryValue="10"
//             secondaryLabel="Approved"
//             icon={<AlertCircle className="w-5 h-5" />}
//           />
//         </div>
//       </div>

//       <div className="space-y-6 pt-4">
//         <h1 className="text-xl font-bold text-foreground -mb-0">Overview</h1>
//         <p>Monitor sales, user roles, and active chambers.</p>
//         <ECommerceSection />
//          <ChamberInventorySection />
//       </div>
//     </div>
//   )
// }

// interface StatCardProps {
//   title: string
//   primaryValue: string
//   primaryLabel: string
//   secondaryValue: string
//   secondaryLabel: string
//   icon: React.ReactNode
// }

// function StatCard({
//   title,
//   primaryValue,
//   primaryLabel,
//   secondaryValue,
//   secondaryLabel,
//   icon,
// }: StatCardProps) {

//   return (
//     <Card className="relative overflow-hidden border-1 border-primary/30 rounded-xl">
//       <CardHeader className="pb-2">
//         <div className="flex items-center justify-between">
//           <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
//           <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-3">
//         <div className="grid grid-cols-2 gap-4">
//           <div className="text-center">
//             <p className="text-2xl font-bold text-foreground">{primaryValue}</p>
//             <p className="text-xs text-muted-foreground">{primaryLabel}</p>
//           </div>
//           <div className="text-center">
//             <p className="text-2xl font-bold text-foreground">{secondaryValue}</p>
//             <p className="text-xs text-muted-foreground">{secondaryLabel}</p>
//           </div>
//         </div>

//         {/* View more button */}
//        <div className="border-t pt-3">
//           <Button
//             variant="ghost"
//             size="sm"
//             className="h-7 w-full justify-between px-2 text-xs font-medium text-foreground hover:bg-primary/5"
//           >
//             View more
//             <ArrowRight className="ml-1 h-3 w-3" />
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// dashboard-content.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Warehouse,
  Users,
  Package,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import ChamberInventorySection from "../dashboard/sections/chamber-inventory";
import ECommerceSection from "../dashboard/sections/ecommerce-section";
import { useDashboardStore } from "../../store/dashboardStore";
import { useEffect } from "react";

export default function DashboardContent() {
  const { overview, loading } = useDashboardStore();

  // Optional: show skeleton while loading
  if (loading.overview) return <div className="p-8">Loading…</div>;

  const stats = overview ?? {
    chambers: { active: 0, inactive: 0 },
    orders: { completed: 0, pending: 0 },
    products: { pending: 0, approved: 0 },
    sellerApplications: { pending: 0, approved: 0 },
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="sm:text-3xl text-2xl font-bold text-primary">
          Welcome Back!
        </h1>
        <p className="text-muted-foreground mt-1 mb-5 sm:text-base text-sm">
          Discover the latest updates in your business today.
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Chambers"
            primaryValue={stats.chambers.active.toString()}
            primaryLabel="Active"
            secondaryValue={stats.chambers.inactive.toString()}
            secondaryLabel="Inactive"
            icon={<Warehouse className="w-5 h-5" />}
          />
          <StatCard
            title="Orders"
            primaryValue={stats.orders.completed.toString()}
            primaryLabel="Completed"
            secondaryValue={stats.orders.pending.toString()}
            secondaryLabel="Pending"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Products"
            primaryValue={stats.products.pending.toString()}
            primaryLabel="Pending"
            secondaryValue={stats.products.approved.toString()}
            secondaryLabel="Approved"
            icon={<Package className="w-5 h-5" />}
          />
          <StatCard
            title="Seller Applications"
            primaryValue={stats.sellerApplications.pending.toString()}
            primaryLabel="Pending"
            secondaryValue={stats.sellerApplications.approved.toString()}
            secondaryLabel="Approved"
            icon={<AlertCircle className="w-5 h-5" />}
          />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h1 className="sm:text-xl text-base font-bold text-foreground mb-0">
          Overview
        </h1>
        <p className="sm:text-base text-sm">
          Monitor sales, user roles, and active chambers.
        </p>
        <ECommerceSection />
        <ChamberInventorySection />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  primaryValue: string;
  primaryLabel: string;
  secondaryValue: string;
  secondaryLabel: string;
  icon: React.ReactNode;
}

function StatCard({
  title,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  icon,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-1 border-primary/30 rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{primaryValue}</p>
            <p className="text-xs text-muted-foreground">{primaryLabel}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {secondaryValue}
            </p>
            <p className="text-xs text-muted-foreground">{secondaryLabel}</p>
          </div>
        </div>

        {/* View more button */}
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full justify-between px-2 text-xs font-medium text-foreground hover:bg-primary/5"
          >
            View more
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
