"use client"

import { useState } from "react"
import type { Product } from "@/app/mash-market/product/page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ActionsMenu } from "@/components/user-actions-menu"
import { ConfirmationPopover } from "@/components/confirmation-popover"

interface ProductTableProps {
  products: Product[]
  onApprove: (product: Product) => void
  onReject: (product: Product) => void
  onArchive?: (product: Product) => void
  showApproveReject?: boolean
  viewBase?: string
}

export function ProductTable({
  products,
  onApprove,
  onReject,
  onArchive,
  showApproveReject = true,
  viewBase = "/mash-market/product",
}: ProductTableProps) {
  const [ArchiveProduct, setArchiveProduct] = useState<Product | null>(null)
  const hasAnyReason = products.some((p) => (p as any).rejectReason)
  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

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
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <p className="font-medium truncate">{product.name}</p>
                </div>
              </TableCell>
              <TableCell>{product.seller}</TableCell>
              <TableCell>{formatPrice(product.price)}</TableCell>
              <TableCell className="truncate">{product.category}</TableCell>

              {showApproveReject && (
                <>
                  <TableCell>{product.submittedAt ? formatDate(product.submittedAt) : "N/A"}</TableCell>
                  <TableCell className="capitalize">
                    {product.status === "pending" && (
                      <span className="text-yellow-600 font-medium">Pending</span>
                    )}
                    {product.status === "approved" && (
                      <span className="text-green-600 font-medium">Approved</span>
                    )}
                    {product.status === "rejected" && (
                      <span className="text-red-600 font-medium">Rejected</span>
                    )}
                  </TableCell>
                </>
              )}

              {hasAnyReason && <TableCell className="truncate">{(product as any).rejectReason ?? "—"}</TableCell>}

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
      {ArchiveProduct && (
        <ConfirmationPopover
          action="Archive"
          entity="Product"
          onConfirm={() => {
            if (ArchiveProduct) {
              onArchive?.(ArchiveProduct)
            }
            setArchiveProduct(null)
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
  )
}
