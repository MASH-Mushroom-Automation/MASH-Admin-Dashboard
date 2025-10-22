"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import UserActionsMenu from "@/components/mash-grow/user-actions-menu"
import DeleteConfirmation from "@/components/mash-grow/delete-confirmation"
import RegisterModal from "@/components/mash-grow/register-modal"

interface User {
  id: string
  chamberNumber: string
  name: string
  address: string
  contactNumber: string
  status: "Active" | "Inactive"
  registrationDate: string
}

export default function RegisterChamber() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      chamberNumber: "CH001",
      name: "John Andrew",
      address: "123 Main St",
      contactNumber: "555-0001",
      status: "Active",
      registrationDate: "2024-01-15",
    },
    {
      id: "2",
      chamberNumber: "CH002",
      name: "Maria Fe",
      address: "456 Oak Ave",
      contactNumber: "555-0002",
      status: "Active",
      registrationDate: "2024-01-20",
    },
    {
      id: "3",
      chamberNumber: "CH003",
      name: "Heart Sansibal",
      address: "789 Pine Rd",
      contactNumber: "555-0003",
      status: "Inactive",
      registrationDate: "2024-02-01",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All")
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.chamberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.contactNumber.includes(searchTerm)

    const matchesStatus = statusFilter === "All" || user.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDelete = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId))
    setDeleteUserId(null)
  }

  const handleRegisterSave = (data: any) => {
    const newUser: User = {
      id: String(users.length + 1),
      chamberNumber: `CH${String(users.length + 1).padStart(3, "0")}`,
      name: data.chamberName,
      address: data.address,
      contactNumber: data.contactNumber,
      status: "Active",
      registrationDate: new Date().toISOString().split("T")[0],
    }
    setUsers([...users, newUser])
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setRegisterModalOpen(true)}
          >
            Register User
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, chamber number, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="text-foreground font-semibold">Chamber Number</TableHead>
                <TableHead className="text-foreground font-semibold">Name</TableHead>
                <TableHead className="text-foreground font-semibold">Address</TableHead>
                <TableHead className="text-foreground font-semibold">Contact Number</TableHead>
                <TableHead className="text-foreground font-semibold">Status</TableHead>
                <TableHead className="text-foreground font-semibold">Registration Date</TableHead>
                <TableHead className="text-foreground font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{user.chamberNumber}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.address}</TableCell>
                    <TableCell>{user.contactNumber}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.registrationDate}</TableCell>
                    <TableCell className="text-center">
                      <UserActionsMenu user={user} onDelete={() => setDeleteUserId(user.id)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <RegisterModal open={registerModalOpen} onOpenChange={setRegisterModalOpen} onSave={handleRegisterSave} />

      {/* Delete Confirmation Dialog */}
      {deleteUserId && (
        <DeleteConfirmation onConfirm={() => handleDelete(deleteUserId)} onCancel={() => setDeleteUserId(null)} />
      )}
    </main>
  )
}
