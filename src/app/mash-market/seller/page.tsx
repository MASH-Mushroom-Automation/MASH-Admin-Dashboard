"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"
import { SellerTable } from "@/components/ecommerce/seller-table"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import PaginationWrapper from "@/components/pagination"
import { Archive } from "lucide-react"

export type TabType = "pending" | "rejected"

interface Seller {
  id: string
  name: string
  storeName: string
  username?: string
  email: string
  status: "pending" | "approved" | "rejected"
  rejectReason?: string
  address?: string
  phone?: string
  businessName?: string
  businessType?: string
}

const mockSellers: Seller[] = [
  {
    id: "1",
    name: "Jin Failana",
    username: "jinfail",
    storeName: "Smith Electronics",
    businessName: "Smith Electronics",
    businessType: "Electronics Retail",
    email: "john@smithelectronics.com",
    phone: "+63 912 345 6789",
    status: "pending",
    address: "Caloocan City",
  },
  {
    id: "2",
    name: "Karen Smith",
    username: "karen_s",
    storeName: "Karen Boutique",
    businessName: "Karen Boutique",
    businessType: "Clothing",
    email: "karen@boutique.com",
    phone: "+63 912 000 1111",
    status: "approved",
    address: "Quezon City",
  },
  {
    id: "3",
    name: "Anne Curtis",
    username: "annec",
    storeName: "Anne Beauty Hub",
    businessName: "Anne Beauty Hub",
    businessType: "Cosmetics",
    email: "anne@beautyhub.com",
    phone: "+63 912 222 3333",
    status: "rejected",
    rejectReason: "Incomplete documents",
    address: "Makati City",
  },
  {
    id: "4",
    name: "John Doe",
    username: "johnd4",
    storeName: "John's Store",
    businessName: "John's Store",
    businessType: "General Goods",
    email: "john@store.com",
    phone: "+63 912 444 5555",
    status: "rejected",
    rejectReason: "Invalid information",
    address: "Cebu City",
  },
  {
    id: "5",
    name: "John Doe",
    username: "johnd5",
    storeName: "John's Store",
    businessName: "John's Store",
    businessType: "General Goods",
    email: "john@store.com",
    phone: "+63 912 444 5556",
    status: "rejected",
    address: "Cebu City",
  },
  {
    id: "6",
    name: "John Doe",
    username: "johnd6",
    storeName: "John's Store",
    businessName: "John's Store",
    businessType: "General Goods",
    email: "john@store.com",
    phone: "+63 912 444 5557",
    status: "rejected",
    address: "Cebu City",
  },
  {
    id: "7",
    name: "John Doe",
    username: "johnd7",
    storeName: "John's Store",
    businessName: "John's Store",
    businessType: "General Goods",
    email: "john@store.com",
    phone: "+63 912 444 5558",
    status: "rejected",
    address: "Cebu City",
  },
  {
    id: "8",
    name: "John Doe",
    username: "johnd8",
    storeName: "John's Store",
    businessName: "John's Store",
    businessType: "General Goods",
    email: "john@store.com",
    phone: "+63 912 444 5559",
    status: "rejected",
    address: "Cebu City",
  },


]

export default function SellerContent() {
  const [activeTab, setActiveTab] = useState<TabType>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [sellers, setSellers] = useState<Seller[]>(mockSellers)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const router = useRouter()

  // persist sellers to localStorage so reject reasons survive reload
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mash_sellers")
      if (raw) {
        setSellers(JSON.parse(raw))
      } else {
        // seed initial mock sellers
        localStorage.setItem("mash_sellers", JSON.stringify(mockSellers))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("mash_sellers", JSON.stringify(sellers))
    } catch {
      // ignore
    }
  }, [sellers])
  

  const tabFilteredSellers = sellers.filter((seller) => {
  if (activeTab === "pending") return seller.status === "pending"
  if (activeTab === "rejected") return seller.status === "rejected"
  return true
})

  const filteredSellers = tabFilteredSellers.filter((seller) =>
    seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSellers = filteredSellers.slice(startIndex, endIndex)

  const handleView = (seller: Seller) => {
    // Navigate to seller detail page instead of opening modal
    router.push(`/mash-market/seller/${seller.id}`)
  }

  const handleAccept = (id: string) => {
    setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, status: "approved" } : s)))
  }

  const handleReject = (id: string, reason?: string) => {
    setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, status: "rejected", rejectReason: reason } : s)))
    toast.error(`Seller rejected${reason ? ` — ${reason}` : ""}`)
    // switch to Rejected tab so user immediately sees the rejected seller and reason
    setActiveTab("rejected")
  }

  const handleArchive = (id: string) => {
    // Simulate archiving then navigate to archive page for sellers
    setSellers((prev) => prev.filter((s) => s.id !== id))
    toast.success("Seller archived successfully — opening archive page")
    router.push(`/mash-market/seller/archive?id=${id}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
      
      <div className="w-full px-4 py-8 overflow-x-hidden">
        {/* Header Section */}
        <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
                        {/* <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                          <ChevronLeft className="h-4 w-4" />
                          Back
                        </Button> */}
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
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Archive shortcut (icon-only) placed beside filters */}
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/mash-market/seller/archive")} aria-label="View seller archives">
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table Section */}
        <Card className="overflow-hidden">
          <SellerTable 
            sellers={paginatedSellers.filter(seller => seller.status === activeTab)}
            activeTab={activeTab}
            searchQuery={searchQuery}
            onView={handleView}
            onAccept={handleAccept}
            onReject={handleReject}
            onArchive={handleArchive}
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
  )
}