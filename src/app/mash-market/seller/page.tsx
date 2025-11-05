"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search,  ChevronRight } from "lucide-react"
import { SellerTable } from "@/components/ecommerce/seller-table"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export type TabType = "all" | "approval" | "approved" | "rejected"

export default function SellerContent() {
  const [activeTab] = useState<TabType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
           <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
        All Sellers
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base">
        Manage seller accounts
      </p>
    </div>

    <Button
      onClick={() => router.push("/mash-market/seller/pending-seller")}
      className="bg-yellow-600 hover:bg-yellow-700 gap-2 w-full sm:w-auto justify-center"
    >
      Pending Seller
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
</div>

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
          <SellerTable 
            activeTab={activeTab} 
            searchQuery={searchQuery} 
            showStatus={false}
            mode="all"
            />
        </Card>
      </div>
    </div>
  )
}
