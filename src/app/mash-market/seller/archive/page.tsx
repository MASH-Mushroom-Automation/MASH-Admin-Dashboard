"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import PaginationWrapper from "@/components/pagination"
import { toast } from "sonner"

const ARCHIVED_SELLERS = [
  { id: "3", name: "Anne Curtis", storeName: "Anne Beauty Hub", email: "anne@beautyhub.com", phone: "+63 912 222 3333", status: "rejected" },
]

export default function SellerArchivePage() {
  const [archivedSellers, setArchivedSellers] = useState(ARCHIVED_SELLERS)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSellers = archivedSellers.slice(startIndex, endIndex)

  // Handle bulk unarchive
  const handleUnarchive = async (ids: string[]) => {
    if (ids.length === 0) {
      toast.error("No sellers selected for unarchiving")
      return
    }

    try {
      toast.loading("Unarchiving seller(s)...", { id: "unarchive-seller" })

      // Remove from archived list (mock implementation)
      setArchivedSellers(prev => prev.filter(s => !ids.includes(s.id)))
      setCurrentPage(1)

      toast.success(`Unarchived ${ids.length} seller(s)`, { id: "unarchive-seller" })
    } catch (err) {
      console.error("[SellerArchivePage] Unarchive error:", err)
      toast.error("Failed to unarchive sellers", { id: "unarchive-seller" })
    }
  }

  // Handle export
  const handleExport = (rows: any[]) => {
    const csv = [
      ["Name", "Store", "Email", "Phone"],
      ...rows.map((r) => [
        r.name || "",
        r.storeName || "",
        r.email || "",
        r.phone || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `archived-sellers-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link href="/mash-market/seller">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold">Archived Sellers</h1>
            <p className="text-muted-foreground mt-1">Sellers that were archived</p>
          </div>
        </div>

        <Card>
          <DataTable
            data={paginatedSellers}
            mode="sellers"
            onArchive={handleUnarchive}
            onExport={handleExport}
            archivedView={true}
            simpleActions={true}
            entityName="seller"
          />
        </Card>
        <PaginationWrapper
          totalItems={archivedSellers.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          label="sellers"
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n)
            setCurrentPage(1)
          }}
        />
      </div>
    </div>
  )
}
