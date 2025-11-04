"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ProductTable } from "@/components/ecommerce/product-table"
import { ProductDetailsModal } from "@/components/ecommerce/product-details-modal"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
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
  image: string
  description: string
  status: ProductStatus
  submittedAt: string
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "White Oyster Mushroom",
    seller: "Mushroom Farm",
    price: 129.99,
    category: "Fresh Mushroom",
    image: "/wireless-headphones.png",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    status: "pending",
    submittedAt: "2025-10-28T10:30:00Z",
  },
  {
    id: "2",
    name: "White Mushroom",
    seller: "The farm house",
    price: 34.99,
    category: "Fresh Mushroom",
    image: "/organic-cotton-tshirt.png",
    description: "Sustainable, eco-friendly cotton t-shirt available in multiple colors.",
    status: "pending",
    submittedAt: "2025-10-27T14:15:00Z",
  },
  {
    id: "4",
    name: "Mushroom Chips",
    seller: "Kabutero Co.",
    price: 59.99,
    category: "Processed Mushroom",
    image: "/bamboo-cutting-board.png",
    description: "Set of 3 eco-friendly bamboo cutting boards with different sizes.",
    status: "pending",
    submittedAt: "2025-10-25T16:45:00Z",
  },
  {
    id: "7",
    name: "Mushroom Chicharon",
    seller: "Mushroom Snacks Inc.",
    price: 59.99,
    category: "Processed Mushroom",
    image: "/bamboo-cutting-board.png",
    description: "Set of 3 eco-friendly bamboo cutting boards with different sizes.",
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Fresh Mushroom" | "Processed Mushroom" | "Cultivation Supplies">("All")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.seller.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleArchive = (product: Product) => {
    setProducts(products.map((p) => (p.id === product.id ? { ...p, status: "archived" } : p)))
    toast.success(`Product "${product.name}" has been archived.`)
  }

  const pendingCount = products.filter((p) => p.status === "pending").length
  const approvedCount = products.filter((p) => p.status === "approved").length
  const rejectedCount = products.filter((p) => p.status === "rejected").length

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search by name, seller, or category..."
          filter1Label="Category"
          filter1Value={selectedCategory}
          onFilter1Change={(c: string) => {
            setSelectedCategory(c as typeof selectedCategory)
            setCurrentPage(1)
          }}
          filter1Options={[
            { value: "All", label: "All Categories" },
            { value: "Fresh Mushroom", label: "Fresh Mushroom" },
            { value: "Processed Mushroom", label: "Processed Mushroom" },
            { value: "Cultivation Supplies", label: "Cultivation Supplies" },
          ]}
        />
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto">
        <ProductTable
          products={paginatedProducts}
          onViewDetails={handleViewDetails}
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

      {/* Modals */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onApprove={() => setSelectedProduct(null)}
          onReject={() => setSelectedProduct(null)}
          showActions={false}
        />
      )}
    </div>
  )
}
