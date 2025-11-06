"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/app/mash-market/product/page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// view-only page: no accept/reject handlers here

// NOTE: using local mock data for now; replace with API fetch in production
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
    description:
      "The White Oyster Mushroom grows in layered clusters with broad, fan-shaped caps and tender texture. It is prized in culinary use for its mild, savory taste and excellent ability to absorb seasonings, making it ideal for stir-fries, soups, and plant-based dishes. Beyond its culinary appeal, it is also valued for its fast growth, sustainability, and rich protein and antioxidant content.",
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
    description:
      "Fresh harvested white mushrooms, great for soups and stir fry.",
    status: "approved",
    submittedAt: "2025-10-27T14:15:00Z",
  },
];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const product = MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  const [loading, setLoading] = useState(false);
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  // auto-resize description textarea to fit content and avoid scrollbars
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    // reset height to auto to correctly measure scrollHeight
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [product?.description]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium">Product not found</h2>
            <p className="text-sm text-muted-foreground mt-2">
              We couldn't find a product with that id.
            </p>
            <div className="mt-4">
              <Link href="/mash-market/product">
                <Button>Back to products</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // View-only page: actions handled from pending-product detail page

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
            <p className="text-muted-foreground mt-1">Product details</p>
          </div>
          <div>
            <Link href="/mash-market/product">
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
              <Input
                value={product.name ?? ""}
                disabled
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Category
              </label>
              <Input
                value={product.category ?? ""}
                disabled
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Seller
              </label>
              <Input
                value={product.seller ?? ""}
                disabled
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Price
              </label>
              <Input
                value={formatPricePHP(product.price)}
                disabled
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
                disabled
                readOnly
                className="mt-1"
              />
            </div>
            {/* status is shown only on the pending-product detail page */}
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground">
              Description
            </label>
            <div className="mt-2">
              <textarea
                disabled
                readOnly
                defaultValue={product.description}
                ref={descRef}
                className="w-full min-h-[96px] rounded-md border bg-background/50 p-3 text-sm text-foreground whitespace-pre-wrap break-words focus:outline-none overflow-hidden"
                aria-readonly
              />
            </div>
          </div>

          {/* View-only: Accept/Reject actions live on the pending-product detail page */}
        </Card>
      </div>
    </div>
  );
}
