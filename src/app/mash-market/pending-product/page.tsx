"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import  { Product } from "@/app/mash-market/product/page"
import { ProductTable } from "@/components/ecommerce/product-table"
import { ProductDetailsModal } from "@/components/ecommerce/product-details-modal"
import { ConfirmationModal } from "@/components/ecommerce/confirmation-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft } from "lucide-react"
import { toast } from "sonner"

// Mock data - replace with API call
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    seller: "TechGear Co.",
    price: 129.99,
    category: "Electronics",
    image: "/wireless-headphones.png",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    status: "pending",
    submittedAt: "2025-10-28T10:30:00Z",
  },
  {
    id: "2",
    name: "Organic Cotton T-Shirt",
    seller: "EcoWear Ltd.",
    price: 34.99,
    category: "Clothing",
    image: "/organic-cotton-tshirt.png",
    description: "Sustainable, eco-friendly cotton t-shirt available in multiple colors.",
    status: "pending",
    submittedAt: "2025-10-27T14:15:00Z",
  },
  {
    id: "4",
    name: "Bamboo Cutting Board Set",
    seller: "KitchenPro Store",
    price: 59.99,
    category: "Home & Kitchen",
    image: "/bamboo-cutting-board.png",
    description: "Set of 3 eco-friendly bamboo cutting boards with different sizes.",
    status: "pending",
    submittedAt: "2025-10-25T16:45:00Z",
  },
  {
    id: "7",
    name: "Bamboo Cutting Board Set 2",
    seller: "KitchenPro Store",
    price: 59.99,
    category: "Home & Kitchen",
    image: "/bamboo-cutting-board.png",
    description: "Set of 3 eco-friendly bamboo cutting boards with different sizes.",
    status: "pending",
    submittedAt: "2025-10-22T16:45:00Z",
  },
  {
    id: "9",
    name: "Premium Wireless Headphones 2",
    seller: "TechGear Co.",
    price: 129.99,
    category: "Electronics",
    image: "/wireless-headphones.png",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    status: "pending",
    submittedAt: "2025-10-20T10:30:00Z",
  },
  {
    id: "10",
    name: "Organic Cotton T-Shirt 2",
    seller: "EcoWear Ltd.",
    price: 34.99,
    category: "Clothing",
    image: "/organic-cotton-tshirt.png",
    description: "Sustainable, eco-friendly cotton t-shirt available in multiple colors.",
    status: "pending",
    submittedAt: "2025-10-19T14:15:00Z",
  },
  {
    id: "11",
    name: "Stainless Steel Water Bottle 3",
    seller: "HydroLife Inc.",
    price: 45.0,
    category: "Sports & Outdoors",
    image: "/reusable-water-bottle.png",
    description: "Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours.",
    status: "pending",
    submittedAt: "2025-10-18T09:00:00Z",
  },
  {
    id: "12",
    name: "Yoga Mat Premium 3",
    seller: "FitLife Brands",
    price: 79.99,
    category: "Sports & Outdoors",
    image: "/rolled-yoga-mat.png",
    description: "Non-slip yoga mat with carrying strap, perfect for all fitness levels.",
    status: "pending",
    submittedAt: "2025-10-17T11:20:00Z",
  },
]

const CATEGORIES = ["All Categories", "Electronics", "Clothing", "Sports & Outdoors", "Home & Kitchen"]
const ITEMS_PER_PAGE = 5

export default function PendingProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    product: Product
    action: "approve" | "reject"
  } | null>(null)
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

  const handleApproveClick = (product: Product) => {
    setConfirmAction({ product, action: "approve" })
  }

  const handleRejectClick = (product: Product) => {
    setConfirmAction({ product, action: "reject" })
  }

  const handleConfirmAction = () => {
    if (!confirmAction) return

    const { product, action } = confirmAction
    setProducts(
      products.map((p) => (p.id === product.id ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p)),
    )

    const actionText = action === "approve" ? "approved" : "rejected"
    toast.success(`Product "${product.name}" has been ${actionText}.`)

    setConfirmAction(null)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Pending Products</h1>
          <p className="text-muted-foreground">Review and approve pending product submissions</p>
        </div>

        {/* Search and Filter */}
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
        <div className="bg-card border border-border rounded-lg mb-6">
          <ProductTable
            products={paginatedProducts}
            onViewDetails={handleViewDetails}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
            showApproveReject={true}
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
          onApprove={() => {
            handleApproveClick(selectedProduct)
            setSelectedProduct(null)
          }}
          onReject={() => {
            handleRejectClick(selectedProduct)
            setSelectedProduct(null)
          }}
          showActions={true}
        />
      )}

      {confirmAction && (
        <ConfirmationModal
          title={`${confirmAction.action === "approve" ? "Approve" : "Reject"} Product`}
          message={`Are you sure you want to ${confirmAction.action} "${confirmAction.product.name}"?`}
          confirmText={confirmAction.action === "approve" ? "Approve" : "Reject"}
          confirmVariant={confirmAction.action === "approve" ? "default" : "destructive"}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </main>
  )
}
