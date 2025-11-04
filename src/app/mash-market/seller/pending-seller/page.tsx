"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ChevronLeft } from "lucide-react"
import { SellerTable } from "@/components/ecommerce/seller-table"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import PaginationWrapper from "@/components/pagination"

export type TabType = "pending" | "rejected"

interface Seller {
  id: string
  name: string
  storeName: string
  email: string
  status: "pending" | "approved" | "rejected"
  address?: string
}

const mockSellers: Seller[] = [
  { id: "1", name: "Jin Failana", storeName: "Smith Electronics", email: "john@smithelectronics.com", status: "pending", address: "Caloocan City" },
  { id: "2", name: "Karen Smith", storeName: "Karen Boutique", email: "karen@boutique.com", status: "approved", address: "Quezon City" },
  { id: "3", name: "Anne Curtis", storeName: "Anne Beauty Hub", email: "anne@beautyhub.com", status: "rejected", address: "Makati City" },
  { id: "4", name: "John Doe", storeName: "John's Store", email: "john@store.com", status: "rejected", address: "Cebu City" },
    { id: "5", name: "John Doe", storeName: "John's Store", email: "john@store.com", status: "rejected", address: "Cebu City" },
  { id: "6", name: "John Doe", storeName: "John's Store", email: "john@store.com", status: "rejected", address: "Cebu City" },
  { id: "7", name: "John Doe", storeName: "John's Store", email: "john@store.com", status: "rejected", address: "Cebu City" },
  { id: "8", name: "John Doe", storeName: "John's Store", email: "john@store.com", status: "rejected", address: "Cebu City" },


]

export default function SellerContent() {
  const [activeTab, setActiveTab] = useState<TabType>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const router = useRouter()

  const tabFilteredSellers = mockSellers.filter((seller) => {
  if (activeTab === "pending") return seller.status === "pending"
  if (activeTab === "rejected") return seller.status === "rejected"
  return true
})

  const filteredSellers = tabFilteredSellers.filter((seller) =>
    seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSellers = filteredSellers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

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
            <TabsTrigger value="pending">Pending</TabsTrigger>
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
  <SellerTable 
    sellers={paginatedSellers.filter(seller => seller.status === activeTab)}
    activeTab={activeTab as any}
    searchQuery={searchQuery}
  />
</Card>


        {/* Pagination Section */}
             <PaginationWrapper 
              totalItems={filteredSellers.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              label="Pending"
            />

      </div>
    </div>
  )
}
