"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ProductTable } from "@/components/ecommerce/product-table"
import { ProductDetailsModal } from "@/components/ecommerce/product-details-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronRight } from "lucide-react"
import { toast } from "sonner"

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

// Mock data - replace with API call
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

const CATEGORIES = ["All Categories", "Fresh Mushroom", "Processed Mushroom", "Mushroom Cultivation Supplies"]
const ITEMS_PER_PAGE = 5

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.seller.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
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
    <main className="bg-background">
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Product Management</h1>
            <p className="text-muted-foreground">Review and manage seller-submitted products</p>
          </div>
          <Button
            onClick={() => router.push("/mash-market/product/pending-product")}
            className="bg-yellow-600 hover:bg-yellow-700 gap-2"
          >
            Pending Products
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                <p className="text-3xl font-bold text-foreground">{approvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                <p className="text-3xl font-bold text-foreground">{rejectedCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <span className="text-xl">✕</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name or seller..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Table */}
        <div className="border border-border rounded-lg mb-6">
          <ProductTable
            products={paginatedProducts}
            onViewDetails={handleViewDetails}
            onApprove={() => {}}
            onReject={() => {}}
            onArchive={handleArchive}
            showApproveReject={false}
          />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
    </main>
  )
}
