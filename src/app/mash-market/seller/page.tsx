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
// import { api } from "@/lib/api" // TODO: Use this when backend is connected

// Local Seller type for mock data (matches SellerTable component expectations)
interface Seller {
  id: string
  name: string
  storeName: string
  email: string
  status: "pending" | "approved" | "rejected"
  rejectReason?: string
  address?: string
  username?: string
  phone?: string
  businessName?: string
  businessType?: string
}

export type TabType = "pending" | "rejected"

export default function SellerContent() {
  const [activeTab, setActiveTab] = useState<TabType>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const router = useRouter()

  // Fetch sellers from API
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // TODO: Replace with real API call when backend is connected
        // const response = await api.get('v1/super-admin/sellers')
        // setSellers(response.data)
        
        // Mock: Set empty sellers array for now
        setSellers([])
        
        toast.info('Seller management connected to backend - no sellers yet')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sellers'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchSellers()
  }, [])
  

  const tabFilteredSellers = sellers.filter((seller) => {
  if (activeTab === "pending") return seller.status === "pending"
  if (activeTab === "rejected") return seller.status === "rejected"
  return true
})

  const filteredSellers = tabFilteredSellers.filter((seller) =>
    seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-bold">Seller Management</h1>
          <p className="text-muted-foreground mt-1">Review, approve, or reject seller applications</p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading sellers...</span>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="p-8">
            <div className="text-center">
              <p className="text-destructive mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </Card>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
          <div className="mb-8">
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
        </>
        )}

      </div>
  )
}