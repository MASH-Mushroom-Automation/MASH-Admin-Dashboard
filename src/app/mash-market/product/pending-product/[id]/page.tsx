"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/store/ecommerceStore";
import { Button } from "@/components/ui/button";
import ProductRejectReasonModal from "@/components/ecommerce/product-reject-reason-modal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/status-badge";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

// TODO: Replace with API fetch to get pending product details by ID
// MOCK_PRODUCTS removed to avoid deployment errors

export default function PendingProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // TODO: Fetch product from API using id
  const { id } = use(params);
  // id will be used when API integration is complete
  void id;
  const router = useRouter();
  // TODO: Fetch product from API using id
  const [product] = useState<Product | null>(null); // Will be replaced with API call
  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium">Product not found</h2>
            <p className="text-sm text-muted-foreground mt-2">
              We could not find a product with that id.
            </p>
            <div className="mt-4">
              <Link href="/mash-market/product/pending-product">
                <Button>Back to pending products</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    toast.success("Product accepted");
    router.push("/mash-market/product/pending-product");
  };

  const handleReject = async (reason?: string) => {
    setLoading(true);
    try {
      // TODO: Replace with API call to reject product
      const raw = localStorage.getItem("mash_products");
      type StoredProduct = Product & { rejectReason?: string };
      const parsed = raw ? (JSON.parse(raw) as StoredProduct[]) : [];
      const list = parsed.map((p) =>
        p.id === product?.id
          ? { ...p, status: "rejected", rejectReason: reason }
          : p
      );
      localStorage.setItem("mash_products", JSON.stringify(list));
      await new Promise((r) => setTimeout(r, 300));
      toast.error(`Product rejected${reason ? ` — ${reason}` : ""}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject product");
    } finally {
      setLoading(false);
      setRejectModalOpen(false);
      router.push("/mash-market/product/pending-product");
    }
  };

  const formatPricePHP = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(numPrice);
  };
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-1">Pending product review</p>
          </div>
          <div>
            <Link href="/mash-market/product/pending-product">
              <Button variant="ghost">Back</Button>
            </Link>
          </div>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Product Name
              </label>
              <Input value={product.name ?? ""} readOnly className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Category
              </label>
              <Input value={product.category ?? ""} readOnly className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Seller
              </label>
              <Input value={product.seller ?? ""} readOnly className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Price
              </label>
              <Input
                value={formatPricePHP(product.price ?? 0)}
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Date Submitted
              </label>
              <Input
                value={
                  product.submittedAt ? formatDate(product.submittedAt) : ""
                }
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Status
              </label>
              <div className="mt-2">
                {product.status ? <StatusBadge status={product.status} /> : "-"}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold text-muted-foreground">
              Description
            </label>
            <p className="mt-2 text-foreground">{product.description}</p>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="destructive"
              onClick={() => setRejectModalOpen(true)}
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              <Check className="mr-2 h-4 w-4" /> Accept
            </Button>
          </div>
          <ProductRejectReasonModal
            open={rejectModalOpen}
            onOpenChange={setRejectModalOpen}
            onConfirm={(reason) => handleReject(reason)}
          />
        </Card>
      </div>
    </div>
  );
}
