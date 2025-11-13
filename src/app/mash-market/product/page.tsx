"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProductTable } from "@/components/ecommerce/product-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ChevronRight } from "lucide-react"
import { Archive } from "lucide-react"
import { toast } from "sonner"
import PaginationWrapper from "@/components/pagination"
import { SearchFilterBar } from "@/components/search-filter-bar"
// import { api } from "@/lib/api" // TODO: Use this when backend is connected
import { Card } from "@/components/ui/card"

// Local Product type for mock data (until backend integration)
export interface Product {
  id: string
  name: string
  category: string
  business?: string
  seller?: string // For filtering purposes
  price: number
  status: ProductStatus
  imageUrl?: string
  // Additional fields for detail pages
  subcategory?: string
  unit?: string
  stockQuantity?: number
  images?: string[]
  image?: string
  sellerInfo?: {
    sellerName: string
    businessName: string
    contactNumber: string
    businessAddress: string
  }
  description?: string
  submittedAt?: string
  rejectReason?: string
}

export type ProductStatus = "pending" | "approved" | "rejected" | "archived"

const ITEMS_PER_PAGE = 5

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // no modal: view navigates to product page
  const [searchQuery, setSearchQuery] = useState("")
  // bulk filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // TODO: Replace with real API call when backend is connected
        // const response = await api.get('v1/super-admin/products')
        // setProducts(response.data)
        
        // Mock: Set empty products array for now
        setProducts([])

        toast.info('Product management connected to backend - no products yet')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const businessOptions = useMemo(() => {
    return Array.from(
      new Set(
        products.map((p) => p.seller).filter((b) => !!b) as string[]
      )
    )
  }, [products])

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)))
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.seller?.toLowerCase().includes(searchQuery.toLowerCase())

      // Category matching (if any category checkboxes selected)
      const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(product.category) : true

      const businessName = product.seller
      const matchesBusiness = selectedBusinesses.length > 0 ? (businessName ? selectedBusinesses.includes(businessName) : false) : true

      return matchesSearch && matchesCategory && matchesBusiness
    })
  }, [products, searchQuery, selectedCategories, selectedBusinesses])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])


  const handleArchive = (product: Product) => {
    // Archive functionality - would update via API in production
    toast.success(`Product "${product.name}" has been archived.`)
    router.push(`/mash-market/product/archive?id=${product.id}`)
  }

  return (
    <div className="w-full px-4 py-8 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground mt-1 sm:text-base text-sm">
            Review and manage seller-submitted products
          </p>
        </div>
        <Button
          onClick={() => router.push("/mash-market/product/pending-product")}
          className="bg-primary hover:bg-primary/80 gap-2 w-full sm:w-auto justify-center"
        >
          Pending Products
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading products...</span>
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

      {/* Search and Filter */}
      <div className="mb-2">
        <div className="flex items-center">
          <div className="flex-1">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Search by name, seller, or category..."
            />
          </div>
          <div className="flex items-center gap-2 -mt-6">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center py-4.5">
                      <span className="font-medium">Filters</span>
                      { (selectedCategories.length + selectedBusinesses.length) > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-emerald-700 py-0.5 text-xs text-white">
                          {selectedCategories.length + selectedBusinesses.length}
                        </span>
                      )}
                    </Button>
                </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-64 p-2">
                      <DropdownMenuLabel>Category</DropdownMenuLabel>
                      <div className="px-1">
                        {categoryOptions.map((c) => (
                          <label key={c} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                            <input
                              type="checkbox"
                              className="rounded-sm"
                              checked={selectedCategories.includes(c)}
                              onChange={(e) => {
                                const val = e.target.checked
                                setCurrentPage(1)
                                setSelectedCategories((prev) => (val ? Array.from(new Set([...prev, c])) : prev.filter((x) => x !== c)))
                              }}
                            />
                            <span className="text-sm">{c}</span>
                          </label>
                        ))}
                      </div>

                      <DropdownMenuSeparator />

                      <DropdownMenuLabel>Business name</DropdownMenuLabel>
                      <div className="px-1">
                        {businessOptions.map((b) => (
                          <label key={b} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                            <input
                              type="checkbox"
                              className="rounded-sm"
                              checked={selectedBusinesses.includes(b)}
                              onChange={(e) => {
                                const val = e.target.checked
                                setCurrentPage(1)
                                setSelectedBusinesses((prev) => (val ? Array.from(new Set([...prev, b])) : prev.filter((x) => x !== b)))
                              }}
                            />
                            <span className="text-sm">{b}</span>
                          </label>
                        ))}
                      </div>

                      <DropdownMenuSeparator />

                      <div className="px-1">
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedCategories(categoryOptions.slice())
                            setSelectedBusinesses(businessOptions.slice())
                            setCurrentPage(1)
                          }}
                        >
                          Select all
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedCategories([])
                            setSelectedBusinesses([])
                            setCurrentPage(1)
                          }}
                        >
                          Clear
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/mash-market/product/archive")} aria-label="View product archives">
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto">
        <ProductTable
          products={paginatedProducts}
          onApprove={() => {}}
          onReject={() => {}}
          onArchive={handleArchive}
          showApproveReject={false}
        />
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <PaginationWrapper
          totalItems={filteredProducts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          label="products"
        />
      </div>

      {/* Product details are now a page at /mash-market/product/[id] - modal removed */}
      </>
      )}
    </div>
  )
}
