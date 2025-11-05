"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import  { Product } from "@/app/mash-market/product/page"
import { ProductTable } from "@/components/ecommerce/product-table"
import ProductRejectReasonModal from "@/components/ecommerce/product-reject-reason-modal"
import { ConfirmationModal } from "@/components/ecommerce/confirmation-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import PaginationWrapper from "@/components/pagination"


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

export default function PendingProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  // persist products to localStorage so reject reasons survive reload
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mash_products")
      if (raw) {
        setProducts(JSON.parse(raw))
      } else {
        localStorage.setItem("mash_products", JSON.stringify(MOCK_PRODUCTS))
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("mash_products", JSON.stringify(products))
    } catch (e) {}
  }, [products])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  // view navigates to product page; modal removed
  const [confirmAction, setConfirmAction] = useState<{
    product: Product
    action: "approve" | "reject" | "archive"
  } | null>(null)
  const [productToReject, setProductToReject] = useState<Product | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
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

  // handled by link to product page

  const handleApproveClick = (product: Product) => {
    setConfirmAction({ product, action: "approve" })
  }

  const handleRejectClick = (product: Product) => {
    // open reject reason modal for this product
    setProductToReject(product)
    setRejectModalOpen(true)
  }

  const handleArchiveClick = (product: Product) => {
    setConfirmAction({ product, action: "archive" })
  }

  const handleConfirmAction = () => {
    if (!confirmAction) return

    const { product, action } = confirmAction

    if (action === "archive") {
      setProducts(products.filter((p) => p.id !== product.id))
      toast.success(`Product "${product.name}" has been archived.`)
    } else {
      setProducts(
        products.map((p) => (p.id === product.id ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p)),
      )

      const actionText = action === "approve" ? "accepted" : "rejected"
      toast.success(`Product "${product.name}" has been ${actionText}.`)
    }

    setConfirmAction(null)
  }

  const handleRejectConfirm = (reason?: string) => {
    if (!productToReject) return
    setProducts((prev) => prev.map((p) => (p.id === productToReject.id ? { ...p, status: "rejected", rejectReason: reason } : p)))
    toast.error(`Product "${productToReject.name}" rejected${reason ? ` — ${reason}` : ""}`)
    setProductToReject(null)
    setRejectModalOpen(false)
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
        {/* <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div> */}

            {/* Category Filter */}
            {/* <Select
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
        </div> */}

        {/* Product Table */}
        <div className="bg-card border border-border rounded-lg mb-6">
          <ProductTable
            products={paginatedProducts}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
            onArchive={handleArchiveClick}
            showApproveReject={true}
            viewBase="/mash-market/product/pending-product"
          />
        </div>

        {/* Pagination */}
        <PaginationWrapper
          totalItems={filteredProducts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
          label="pending products"
        />
      </div>

      {/* Product details are now a page at /mash-market/product/[id] - modal removed */}

      {confirmAction && (
        <ConfirmationModal
          title={`${confirmAction.action === "approve" ? "Accept" : confirmAction.action === "reject" ? "Reject" : "Archive"} Product`}
          message={`Are you sure you want to ${confirmAction.action} "${confirmAction.product.name}"?`}
          confirmText={confirmAction.action === "approve" ? "Accept" : confirmAction.action === "reject" ? "Reject" : "Archive"}
          confirmVariant={confirmAction.action === "reject" || confirmAction.action === "archive" ? "destructive" : "default"}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      <ProductRejectReasonModal open={rejectModalOpen} onOpenChange={setRejectModalOpen} onConfirm={(reason) => handleRejectConfirm(reason)} />
    </main>
  )
}
