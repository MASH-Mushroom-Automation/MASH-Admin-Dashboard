"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import UserAvatar from "@/components/ecommerce/user-avatar"
import StatusBadge from "@/components/status-badge"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import { ActionsMenu } from "@/components/user-actions-menu"
import { SearchFilterBar } from "@/components/search-filter-bar"
import PaginationWrapper from "@/components/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"


interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: "Admin" | "Seller" | "User"
  status: "Active" | "Inactive"
  avatar: string
}

const MOCK_USERS: User[] = [
  { id: "1", name: "Sarah Johnson", username: "sarahjohn", email: "sarah@example.com", phone: "+1 (555) 123-4567", role: "Admin", status: "Active", avatar: "SJ" },
  { id: "2", name: "Emma Davis", username: "emmadavis", email: "emma@example.com", phone: "+1 (555) 345-6789", role: "User", status: "Inactive", avatar: "ED" },
  { id: "3", name: "Sophie Brown", username: "sophieb", email: "sophie@example.com", phone: "+1 (555) 789-0123", role: "User", status: "Active", avatar: "SB" },
  { id: "4", name: "Liam Carter", username: "liamc", email: "liam@example.com", phone: "+1 (555) 111-2222", role: "Seller", status: "Active", avatar: "LC" },
  { id: "5", name: "Ava Thompson", username: "avath", email: "ava@example.com", phone: "+1 (555) 333-4444", role: "User", status: "Inactive", avatar: "AT" },
  { id: "6", name: "Noah Walker", username: "noahw", email: "noah@example.com", phone: "+1 (555) 555-6666", role: "User", status: "Active", avatar: "NW" },
  { id: "7", name: "Olivia Martin", username: "oliviam", email: "olivia@example.com", phone: "+1 (555) 777-8888", role: "Admin", status: "Active", avatar: "OM" },
]

const ITEMS_PER_PAGE = 5

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"All" | "Admin" | "Seller" | "User">("All")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)


  // Filtered users
  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter((user) => {
      const matchesSearch =
        [user.name, user.email, user.username].some((field) =>
          field.toLowerCase().includes(searchQuery.toLowerCase())
        )
      const matchesRole = roleFilter === "All" || user.role === roleFilter
      const matchesStatus = statusFilter === "All" || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [searchQuery, roleFilter, statusFilter])

  // Pagination logic
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleDelete = () => {
    console.log("Confirmed delete user:", deletingId)
    // TODO: Connect API deletion here
    setShowDeleteConfirm(false)
    setDeletingId(null)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header>
          <h1 className="sm:text-3xl text-2xl font-bold">Users Management</h1>
          <p className="text-muted-foreground mt-1 mb-5 sm:text-base text-sm">Accounts Overview</p>
        </header>

        {/* Search and Filters */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search by name, email, or username..."
          filter1Label="Role"
          filter1Value={roleFilter}
          onFilter1Change={(v) => {
            setRoleFilter(v as typeof roleFilter)
            setCurrentPage(1)
          }}
          filter1Options={[
            { value: "All", label: "All Roles" },
            { value: "Admin", label: "Admin" },
            { value: "Seller", label: "Seller" },
            { value: "User", label: "User" },
          ]}
          filter2Label="Status"
          filter2Value={statusFilter}
          onFilter2Change={(v) => {
            setStatusFilter(v as typeof statusFilter)
            setCurrentPage(1)
          }}
          filter2Options={[
            { value: "All", label: "All Status" },
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ]}
        />

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <tr>
                  {["Profile", "Name", "Username", "Email", "Phone", "Role", "Status", "Actions"].map((h) => (
                    <TableHead key={h}>
                      {h}
                    </TableHead>
                  ))}
                </tr>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-6 py-4"><UserAvatar initials={user.avatar} /></TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground truncate">{user.username}</TableCell>
                    <TableCell className="whitespace-nowrap truncate">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap truncate">{user.phone}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell><StatusBadge status={user.status} /></TableCell>
                    <TableCell>
                      <ActionsMenu
                        id={user.id}
                        viewUrl={`/users/view/${user.id}`}
                        onDelete={() => {
                          setDeletingId(user.id)
                          setShowDeleteConfirm(true)
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        <PaginationWrapper
          totalItems={filteredUsers.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          label="users"
        />

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <ConfirmationPopover
            action="delete"
            entity="User"
            onConfirm={handleDelete}
            onCancel={() => {
              setShowDeleteConfirm(false)
              setDeletingId(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
