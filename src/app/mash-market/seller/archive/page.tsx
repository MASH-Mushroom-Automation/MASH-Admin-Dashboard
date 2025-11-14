"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

const ARCHIVED_SELLERS = [
  { id: "3", name: "Anne Curtis", storeName: "Anne Beauty Hub", email: "anne@beautyhub.com", phone: "+63 912 222 3333", status: "rejected" },
]

export default function SellerArchivePage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-end mb-2">
            <div className="shrink-0">
              <Link href="/mash-market/seller">
                <Button variant="ghost">Back</Button>
              </Link>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Archived Sellers</h1>
            <p className="text-muted-foreground mt-1">Sellers that were archived</p>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto p-4">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead> Name </TableHead>
                  <TableHead> Store </TableHead>
                  <TableHead> Email </TableHead>
                  <TableHead> Phone </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {ARCHIVED_SELLERS.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.storeName}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone}</TableCell>
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
