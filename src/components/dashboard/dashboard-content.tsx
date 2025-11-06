"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Users,
  Package,
  Warehouse,
  ArrowRight,
} from "lucide-react";
import ChamberInventorySection from "./chamber-inventory";
import ECommerceSection from "./ecommerce-section";

export default function DashboardContent() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ">
          <StatCard
            title="Chambers"
            primaryValue="5"
            primaryLabel="Connected"
            secondaryValue="5"
            secondaryLabel="Disconnected  "
            icon={<Warehouse className="w-5 h-5" />}
            viewMorePath="/mash-grow/devices"
          />
          <StatCard
            title="Orders"
            primaryValue="100"
            primaryLabel="Completed"
            secondaryValue="20"
            secondaryLabel="Pending"
            icon={<Users className="w-5 h-5" />}
            viewMorePath="/mash-market/order"
          />
          <StatCard
            title="Products"
            primaryValue="30"
            primaryLabel="Pending"
            secondaryValue="10"
            secondaryLabel="Approved"
            icon={<Package className="w-5 h-5" />}
            viewMorePath="/mash-market/product"
          />
          <StatCard
            title=" Seller Applications"
            primaryValue="5"
            primaryLabel="Pending"
            secondaryValue="2"
            secondaryLabel="Approved"
            icon={<AlertCircle className="w-5 h-5" />}
            viewMorePath="/mash-market/seller"
          />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h1 className="sm:text-xl text-base font-bold text-foreground -mb-0">
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
  viewMorePath?: string;
}

function StatCard({
  title,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  icon,
  viewMorePath,
}: StatCardProps) {
  const router = useRouter();

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
            onClick={() =>
              viewMorePath ? router.push(viewMorePath) : undefined
            }
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
