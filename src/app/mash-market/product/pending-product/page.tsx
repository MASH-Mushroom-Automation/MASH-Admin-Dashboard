"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/store/ecommerceStore";
import { ProductTable } from "@/components/ecommerce/product-table";
import ProductRejectReasonModal from "@/components/ecommerce/product-reject-reason-modal";
import { ConfirmationModal } from "@/components/ecommerce/confirmation-modal";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import PaginationWrapper from "@/components/pagination";

// Mock data removed - will be replaced with API integration
// TODO: Fetch pending products from API endpoint
const MOCK_PRODUCTS: Product[] = [];

const ITEMS_PER_PAGE = 5;

export default function PendingProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  // persist products to localStorage so reject reasons survive reload
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mash_products");
      if (raw) {
        setProducts(JSON.parse(raw));
      } else {
        localStorage.setItem("mash_products", JSON.stringify(MOCK_PRODUCTS));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mash_products", JSON.stringify(products));
    } catch {}
  }, [products]);
  const [searchQuery] = useState("");
  const [selectedCategory] = useState("All Categories");
  // view navigates to product page; modal removed
  const [confirmAction, setConfirmAction] = useState<{
    product: Product;
    action: "approve" | "reject" | "archive";
  } | null>(null);
  const [productToReject, setProductToReject] = useState<Product | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.seller?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All Categories" ||
        product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // handled by link to product page

  const handleApproveClick = (product: Product) => {
    setConfirmAction({ product, action: "approve" });
  };

  const handleRejectClick = (product: Product) => {
    // open reject reason modal for this product
    setProductToReject(product);
    setRejectModalOpen(true);
  };

  const handleArchiveClick = (product: Product) => {
    setConfirmAction({ product, action: "archive" });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    const { product, action } = confirmAction;

    if (action === "archive") {
      setProducts(products.filter((p) => p.id !== product.id));
      toast.success(`Product "${product.name}" has been archived.`);
    } else {
      setProducts(
        products.map((p) =>
          p.id === product.id
            ? { ...p, status: action === "approve" ? "approved" : "rejected" }
            : p
        )
      );

      const actionText = action === "approve" ? "accepted" : "rejected";
      toast.success(`Product "${product.name}" has been ${actionText}.`);
    }

    setConfirmAction(null);
  };

  const handleRejectConfirm = (reason?: string) => {
    if (!productToReject) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productToReject.id
          ? { ...p, status: "rejected", rejectReason: reason }
          : p
      )
    );
    toast.error(
      `Product "${productToReject.name}" rejected${
        reason ? ` — ${reason}` : ""
      }`
    );
    setProductToReject(null);
    setRejectModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Pending Products
          </h1>
          <p className="text-muted-foreground">
            Review and approve pending product submissions
          </p>
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
          title={`${
            confirmAction.action === "approve"
              ? "Accept"
              : confirmAction.action === "reject"
              ? "Reject"
              : "Archive"
          } Product`}
          message={`Are you sure you want to ${confirmAction.action} "${confirmAction.product.name}"?`}
          confirmText={
            confirmAction.action === "approve"
              ? "Accept"
              : confirmAction.action === "reject"
              ? "Reject"
              : "Archive"
          }
          confirmVariant={
            confirmAction.action === "reject" ||
            confirmAction.action === "archive"
              ? "destructive"
              : "default"
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      <ProductRejectReasonModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        onConfirm={(reason) => handleRejectConfirm(reason)}
      />
    </main>
  );
}
