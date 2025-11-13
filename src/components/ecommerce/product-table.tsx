"use client";

import { useState } from "react";
import type { Product } from "@/store/ecommerceStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActionsMenu } from "@/components/user-actions-menu";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import Image from "next/image";
import { sanitizeImageUrl } from "@/lib/imageUtils";

interface ProductTableProps {
  products: Product[];
  onApprove: (product: Product) => void;
  onReject: (product: Product) => void;
  onArchive?: (product: Product) => void;
  showApproveReject?: boolean;
  viewBase?: string;
}

export function ProductTable({
  products,
  onArchive,
  showApproveReject = true,
  viewBase = "/mash-market/product",
}: ProductTableProps) {
  const [archiveProduct, setArchiveProduct] = useState<Product | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const hasAnyReason = products.some(
    (p) => p.rejectReason !== undefined && p.rejectReason !== null
  );

  // Helper to get image URL with sanitization and fallback
  const getImageUrl = (product: Product): string => {
    // If image previously failed to load, return default image immediately
    if (imageErrors.has(product.id)) {
      return "/defaultImage.png";
    }

    // Get image from various possible fields
    const imageInput =
      product.image ||
      product.imageUrl ||
      (product.images && product.images[0]);

    // Sanitize and validate the image URL
    return sanitizeImageUrl(imageInput);
  };

  const handleImageError = (productId: string) => {
    setImageErrors((prev) => new Set(prev).add(productId));
  };

  // Handle price as both string and number (API returns string)
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice) ? "$0.00" : `$${numPrice.toFixed(2)}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table className="min-w-full text-sm sm:text-base">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Category</TableHead>
            {showApproveReject && (
              <>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Status</TableHead>
              </>
            )}
            {hasAnyReason && <TableHead>Reason</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  {/* Image display - commented out temporarily */}
                  {/* {!imageErrors.has(product.id) &&
                  getImageUrl(product) !== "/defaultImage.png" ? (
                    <Image
                      src={getImageUrl(product)}
                      alt={product.name || "Product"}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded object-cover"
                      onError={() => handleImageError(product.id)}
                      unoptimized
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No Image
                    </div>
                  )} */}
                  <p className="font-medium truncate">
                    {product.name || "N/A"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {product.seller || product.business || "N/A"}
              </TableCell>
              <TableCell>{formatPrice(product.price)}</TableCell>
              <TableCell className="truncate">
                {product.category || "N/A"}
              </TableCell>

              {showApproveReject && (
                <>
                  <TableCell>
                    {product.submittedAt
                      ? formatDate(product.submittedAt)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {product.status === "pending" && (
                      <span className="text-yellow-600 font-medium">
                        Pending
                      </span>
                    )}
                    {product.status === "approved" && (
                      <span className="text-green-600 font-medium">
                        Approved
                      </span>
                    )}
                    {product.status === "rejected" && (
                      <span className="text-red-600 font-medium">Rejected</span>
                    )}
                  </TableCell>
                </>
              )}

              {hasAnyReason && (
                <TableCell className="truncate">
                  {product.rejectReason ?? "—"}
                </TableCell>
              )}

              {/* Actions: use three-dot menu for view/Archive in pending context */}
              <TableCell>
                <div className="flex items-center">
                  <ActionsMenu
                    id={product.id}
                    viewUrl={`${viewBase}/${product.id}`}
                    onArchive={() => setArchiveProduct(product)}
                    showView={true}
                    showEdit={false}
                    ArchiveLabel={onArchive ? "Archive" : "Archive"}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Confirmation popover for Archive */}
      {archiveProduct && (
        <ConfirmationPopover
          action="Archive"
          entity="Product"
          onConfirm={() => {
            if (archiveProduct) {
              onArchive?.(archiveProduct);
            }
            setArchiveProduct(null);
          }}
          onCancel={() => setArchiveProduct(null)}
        />
      )}

      {products.length === 0 && (
        <div className="text-center text-muted-foreground py-6">
          No products found
        </div>
      )}
    </div>
  );
}
