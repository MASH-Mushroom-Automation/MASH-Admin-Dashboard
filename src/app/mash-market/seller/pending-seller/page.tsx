"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ChevronLeft } from "lucide-react"
import { SellerTable } from "@/components/ecommerce/seller-table"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export type TabType = "approval" | "rejected"

export default function SellerContent() {
  const [activeTab, setActiveTab] = useState<TabType>("approval")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                          <ChevronLeft className="h-4 w-4" />
                          Back
                        </Button>
                      </div>
          <h1 className="sm:text-3xl text-2xl font-bold text-foreground mb-2">Pending Sellers</h1>
          <p className="text-muted-foreground sm:text-base text-sm">Review seller application</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="mb-6">
          <TabsList className="flex w-full ">
            <TabsTrigger value="approval">Pending</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        
        </div>

        {/* Table Section */}
        <Card className="overflow-hidden">
          <SellerTable activeTab={activeTab} searchQuery={searchQuery} />
        </Card>
      </div>
    </div>
  )
}
