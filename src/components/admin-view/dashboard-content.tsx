"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Users, Package } from "lucide-react"
import ChamberInventorySection from "./sections/chamber-inventory"
import GrowersSection from "./sections/growers-section"
import BuyersSection from "./sections/buyers-section"
import ECommerceSection from "./sections/ecommerce-section"

export default function DashboardContent() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your business today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Chambers" value="45" total="50" offline="2" icon={<Package className="w-5 h-5" />} />
        <StatCard title="Total Buyers" value="300" new="25" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Approved Products" value="300" pending="25" icon={<Users className="w-5 h-5" />} />

        <StatCard
          title="Pending Applications"
          value="10"
          subInfo={[
            { label: "Growers", value: "8" },
            { label: "Sellers", value: "2" }
          ]}
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      {/* Chamber Inventory Section */}
      <ChamberInventorySection />

      {/* Growers/Sellers Section */}
      <GrowersSection />

      {/* E-Commerce Section */}
      <ECommerceSection />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  total?: string
  offline?: string
  new?: string
  pending?: string
  subInfo?: Array<{ label: string; value: string }>
  icon: React.ReactNode
}

function StatCard({ title, value, total, offline, new: newVal, pending, subInfo, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {total && <p className="text-xs text-muted-foreground">Total: {total}</p>}
          {offline && <p className="text-xs text-muted-foreground">Offline: {offline}</p>}
          {newVal && <p className="text-xs text-muted-foreground">New: {newVal}</p>}
          {pending && <p className="text-xs text-muted-foreground">Pending: {pending}</p>}
          {subInfo && (
            <div className="space-y-1 pt-2 border-t border-border">
              {subInfo.map((info, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{info.label}</span>
                  <span className="font-medium">{info.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
