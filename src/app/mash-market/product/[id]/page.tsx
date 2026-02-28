"use client";

import React, { useRef, use, useState } from "react";
import Link from "next/link";
import { Product } from "@/store/ecommerceStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// view-only page: no accept/reject handlers here

// TODO: Replace with API fetch to get product details by ID
// const MOCK_PRODUCTS removed to avoid deployment errors

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // TODO: Fetch product from API using id
  const { id } = use(params);
  // id will be used when API integration is complete
  void id;
  const [product] = useState<Product | null>(null); // Will be replaced with API call
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  // auto-resize description textarea to fit content and avoid scrollbars
  // Disabled until API integration provides product data
  // useEffect(() => {
  //   const el = descRef.current;
  //   if (!el || !product) return;
  //   // reset height to auto to correctly measure scrollHeight
  //   el.style.height = "auto";
  //   el.style.height = `${el.scrollHeight}px`;
  // }, [product?.description]);

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
