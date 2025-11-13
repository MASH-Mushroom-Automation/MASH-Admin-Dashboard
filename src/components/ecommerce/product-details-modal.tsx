"use client";

import Image from "next/image";
import type { Product } from "@/app/mash-market/product/page";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  showActions?: boolean;
}

export function ProductDetailsModal({
  product,
  onClose,
  onApprove,
  onReject,
  showActions = false,
}: ProductDetailsModalProps) {
  const formatPricePHP = (price: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();
  const [selectedImage, setSelectedImage] = useState(0);
  const images = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images
    if (product.image) return [product.image]
    return []
  }, [product.images, product.image])

  // Keyboard navigation for multiple images
  useEffect(() => {
    if (!images || images.length <= 1) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedImage((s) => (s - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight") {
        setSelectedImage((s) => (s + 1) % images.length);
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Product Details</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Images */}
          <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center w-full">
              <Image
                src={images[selectedImage] || "/placeholder.svg"}
                alt={`${product.name} image ${selectedImage + 1}`}
                width={640}
                height={360}
                className="max-w-full max-h-144 rounded-lg object-contain"
              />

              {/* Prev / Next controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage(
                        (s) => (s - 1 + images.length) % images.length
                      )
                    }
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/40"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() =>
                      setSelectedImage((s) => (s + 1) % images.length)
                    }
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/40"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute right-3 top-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
                    {selectedImage + 1}/{images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img + idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-12 h-12 rounded overflow-hidden border ${
                      idx === selectedImage
                        ? "ring-2 ring-primary"
                        : "border-border"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumb ${idx + 1}`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Product Name
              </label>
              <p className="text-lg font-medium text-foreground mt-1">
                {product.name}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Category
              </label>
              <p className="text-foreground mt-1">{product.category}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Description
              </label>
              <p className="text-foreground mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">
                  Price
                </label>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatPricePHP(product.price)}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">
                  Unit / Quantity
                </label>
                <p className="text-foreground mt-1">{product.unit ?? "—"}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground">
                Date Submitted
              </label>
              <p className="text-foreground mt-1">
                {product.submittedAt ? formatDate(product.submittedAt) : 'N/A'}
              </p>
            </div>

            {/* Seller Info */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-lg font-semibold">Seller Information</h3>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Seller Name
                  </label>
                  <p className="text-foreground mt-1">
                    {product.sellerInfo?.sellerName ?? product.seller}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Business Name
                  </label>
                  <p className="text-foreground mt-1">
                    {product.sellerInfo?.businessName ?? "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Contact Number
                  </label>
                  <p className="text-foreground mt-1">
                    {product.sellerInfo?.contactNumber ?? "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Business Address
                  </label>
                  <p className="text-foreground mt-1">
                    {product.sellerInfo?.businessAddress ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && product.status === "pending" && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onReject}
                className="flex-1"
              >
                Reject
              </Button>
              <Button
                onClick={onApprove}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Accept
              </Button>
            </div>
          )}

          {(!showActions || product.status !== "pending") && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full bg-transparent"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
