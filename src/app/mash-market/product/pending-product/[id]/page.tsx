"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/app/mash-market/product/page";
import { Button } from "@/components/ui/button";
import ProductRejectReasonModal from "@/components/ecommerce/product-reject-reason-modal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/status-badge";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

// Use same mock data as pending-product list; replace with API fetch in future
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "White Oyster Mushroom",
    seller: "Mushroom Farm",
    price: 129.99,
    category: "Fresh Mushroom",
    description: "High-quality oyster mushrooms grown locally.",
    status: "pending",
    submittedAt: "2025-10-28T10:30:00Z",
  },
  {
    id: "2",
    name: "White Mushroom",
    seller: "The farm house",
    price: 34.99,
    category: "Fresh Mushroom",
    description: "Fresh harvested white mushrooms.",
    status: "pending",
    submittedAt: "2025-10-27T14:15:00Z",
  },
];

export default function PendingProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const product = MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
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
      const raw = localStorage.getItem("mash_products");
      type StoredProduct = Product & { rejectReason?: string };
      const parsed = raw ? (JSON.parse(raw) as StoredProduct[]) : MOCK_PRODUCTS as StoredProduct[];
      const list = parsed.map((p) =>
        p.id === product.id ? { ...p, status: "rejected", rejectReason: reason } : p
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

  const formatPricePHP = (price: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price);
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
                {product.status ? (
                  <StatusBadge status={product.status} />
                ) : (
                  "-"
                )}
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
