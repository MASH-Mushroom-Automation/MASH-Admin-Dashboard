"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

// Minimal mock of archived users (in a real app this would come from the server)
const ARCHIVED_USERS = [
  { id: "2", name: "Emma Davis", username: "emmadavis", email: "emma@example.com", phone: "+1 (555) 345-6789", role: "Customer", status: "Inactive" },
]

export default function UserArchivePage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Archived Users</h1>
            <p className="text-muted-foreground mt-1">Items that have been archived</p>
          </div>
          <div>
            <Link href="/mash-market/user">
              <Button variant="ghost">Back</Button>
            </Link>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead> Name </TableHead>
                  <TableHead> Username </TableHead>
                  <TableHead> Email </TableHead>
                  <TableHead> Phone </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {ARCHIVED_USERS.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone}</TableCell>
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
