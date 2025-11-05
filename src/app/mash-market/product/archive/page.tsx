"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

const ARCHIVED_PRODUCTS = [
  { id: "10", name: "White Mushroom", seller: "The farm house", price: 34.99, status: "archived" },
]

export default function ProductArchivePage() {
  return (
    <div className="w-full px-4 py-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Archived Products</h1>
            <p className="text-muted-foreground mt-1">Products that were archived</p>
          </div>
          <div>
            <Link href="/mash-market/product">
              <Button variant="ghost">Back</Button>
            </Link>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead> Product </TableHead>
                  <TableHead> Seller </TableHead>
                  <TableHead> Price </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {ARCHIVED_PRODUCTS.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.seller}</TableCell>
                    <TableCell>{p.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}
