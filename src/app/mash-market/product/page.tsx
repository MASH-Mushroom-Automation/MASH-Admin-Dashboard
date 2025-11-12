"use client"

import { useState, useMemo } from "react"
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

export type ProductStatus = "pending" | "approved" | "rejected" | "archived"

export interface Product {
  id: string
  name: string
  seller: string
  price: number
  category: string
  image?: string
  images?: string[]
  subcategory?: string
  unit?: string
  stockQuantity?: number
  sellerInfo?: {
    sellerName?: string
    businessName?: string
    contactNumber?: string
    businessAddress?: string
  }
  description: string
  status: ProductStatus
  rejectReason?: string
  submittedAt: string
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "White Oyster Mushroom",
    seller: "Mushroom Farm",
    price: 129.99,
    category: "Fresh Mushroom",
    subcategory: "Fresh",
    unit: "per 250g",
    stockQuantity: 120,
    images: ["/wireless-headphones.png", "/reusable-water-bottle.png"],
    image: "/wireless-headphones.png",
    sellerInfo: {
      sellerName: "Mushroom Farm",
      businessName: "Mushroom Farm Co.",
      contactNumber: "+63 912 345 6789",
      businessAddress: "123 Farm Lane, Rizal, Philippines",
    },
    description: "High-quality oyster mushrooms grown locally. Fresh, flavorful, and perfect for cooking or grilling.",
    status: "pending",
    submittedAt: "2025-10-28T10:30:00Z",
  },
  {
    id: "2",
    name: "White Mushroom",
    seller: "The farm house",
    price: 34.99,
    category: "Fresh Mushroom",
    subcategory: "Fresh",
    unit: "per 250g",
    stockQuantity: 250,
    images: ["/organic-cotton-tshirt.png"],
    image: "/organic-cotton-tshirt.png",
    sellerInfo: {
      sellerName: "The farm house",
      businessName: "The Farm House Co.",
      contactNumber: "+63 922 111 2222",
      businessAddress: "45 Countryside Ave, Laguna, Philippines",
    },
    description: "Fresh harvested white mushrooms, great for soups and stir fry.",
    status: "pending",
    submittedAt: "2025-10-27T14:15:00Z",
  },
  {
    id: "4",
    name: "Mushroom Chips",
    seller: "Kabutero Co.",
    price: 59.99,
    category: "Processed Mushroom",
    subcategory: "Chips",
    unit: "per pack",
    stockQuantity: 80,
    images: ["/bamboo-cutting-board.png"],
    image: "/bamboo-cutting-board.png",
    sellerInfo: {
      sellerName: "Kabutero Co.",
      businessName: "Kabutero Snacks",
      contactNumber: "+63 933 333 4444",
      businessAddress: "Unit 5, Market St., Cebu, Philippines",
    },
    description: "Crispy mushroom chips made from locally sourced mushrooms.",
    status: "pending",
    submittedAt: "2025-10-25T16:45:00Z",
  },
  {
    id: "7",
    name: "Mushroom Chicharon",
    seller: "Mushroom Snacks Inc.",
    price: 59.99,
    category: "Processed Mushroom",
    subcategory: "Chicharon",
    unit: "per pack",
    stockQuantity: 50,
    images: ["/bamboo-cutting-board.png"],
    image: "/bamboo-cutting-board.png",
    sellerInfo: {
      sellerName: "Mushroom Snacks Inc.",
      businessName: "Mushroom Snacks Inc.",
      contactNumber: "+63 944 555 6666",
      businessAddress: "Blk 3 Lot 7, Davao City, Philippines",
    },
    description: "A crunchy, savory mushroom chicharon alternative.",
    status: "pending",
    submittedAt: "2025-10-22T16:45:00Z",
  },
  {
    id: "9",
    name: "Mushroom Jerky",
    seller: "Healthy Bites",
    price: 129.99,
    category: "Processed Mushroom",
    image: "/wireless-headphones.png",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    status: "pending",
    submittedAt: "2025-10-20T10:30:00Z",
  },
  {
    id: "10",
    name: "White Mushroom",
    seller: "The farm house",
    price: 34.99,
    category: "Fresh Mushroom",
    image: "/organic-cotton-tshirt.png",
    description: "Sustainable, eco-friendly cotton t-shirt available in multiple colors.",
    status: "pending",
    submittedAt: "2025-10-19T14:15:00Z",
  },
  {
    id: "11",
    name: "Fruiting Bags",
    seller: "Mushroom Growers Ltd.",
    price: 45.0,
    category: "Mushroom Cultivation Supplies",
    image: "/reusable-water-bottle.png",
    description: "Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours.",
    status: "pending",
    submittedAt: "2025-10-18T09:00:00Z",
  },
  {
    id: "12",
    name: "Fruting Bags",
    seller: "The mushroom house",
    price: 79.99,
    category: "Mushroom Cultivation Supplies",
    image: "/rolled-yoga-mat.png",
    description: "Non-slip yoga mat with carrying strap, perfect for all fitness levels.",
    status: "pending",
    submittedAt: "2025-10-17T11:20:00Z",
  },
]

const ITEMS_PER_PAGE = 5

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  // no modal: view navigates to product page
  const [searchQuery, setSearchQuery] = useState("")
  // bulk filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const businessOptions = useMemo(() => {
    return Array.from(
      new Set(
        products.map((p) => p.sellerInfo?.businessName).filter((b) => !!b) as string[]
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
        product.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sellerInfo?.businessName || "").toLowerCase().includes(searchQuery.toLowerCase())

      // Category matching (if any category checkboxes selected)
      const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(product.category) : true

      const businessName = product.sellerInfo?.businessName
      const matchesBusiness = selectedBusinesses.length > 0 ? (businessName ? selectedBusinesses.includes(businessName) : false) : true

      return matchesSearch && matchesCategory && matchesBusiness
    })
  }, [products, searchQuery, selectedCategories, selectedBusinesses])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])


  const handleArchive = (product: Product) => {
    setProducts(products.map((p) => (p.id === product.id ? { ...p, status: "archived" } : p)))
    toast.success(`Product "${product.name}" has been archived.`)
    // navigate to product archive page
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

      {/* Stats Section */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pending Review", count: pendingCount, color: "bg-yellow-100 dark:bg-yellow-900/30", icon: "⏳" },
          { label: "Approved", count: approvedCount, color: "bg-green-100 dark:bg-green-900/30", icon: "✓" },
          { label: "Rejected", count: rejectedCount, color: "bg-red-100 dark:bg-red-900/30", icon: "✕" },
        ].map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.count}</p>
            </div>
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
              <span className="text-xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div> */}

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
    </div>
  )
}
