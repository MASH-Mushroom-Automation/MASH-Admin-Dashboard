"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import UserAvatar from "@/components/ecommerce/user-avatar"
import StatusBadge from "@/components/ecommerce/status-badge"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import { ActionsMenu } from "@/components/user-actions-menu"
import { SearchFilterBar } from "@/components/search-filter-bar"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"


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
  {
    id: "1",
    name: "Sarah Johnson",
    username: "sarahjohn",
    email: "sarah@example.com",
    phone: "+1 (555) 123-4567",
    role: "Admin",
    status: "Active",
    avatar: "SJ",
  },
  
  {
    id: "2",
    name: "Emma Davis",
    username: "emmadavis",
    email: "emma@example.com",
    phone: "+1 (555) 345-6789",
    role: "User",
    status: "Inactive",
    avatar: "ED",
  },
 
  {
    id: "3",
    name: "Sophie Brown",
    username: "sophieb",
    email: "sophie@example.com",
    phone: "+1 (555) 789-0123",
    role: "User",
    status: "Active",
    avatar: "SB",
  },
  
 
 
]

const ITEMS_PER_PAGE = 5

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"All" | "Admin" | "Seller" | "User">("All")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === "All" || user.role === roleFilter
      const matchesStatus = statusFilter === "All" || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [searchQuery, roleFilter, statusFilter])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleFilterChange = (callback: () => void) => {
    setCurrentPage(1)
    callback()
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground">Accounts Overview</p>
        </div>

       {/* Filter Bar */}
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search by name, email, or username..."

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
            filter1Label="Role"
          
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
            filter2Label="Status"
          />


        {/* Table Section */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Profile</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Username</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <UserAvatar initials={user.avatar} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.username}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.phone}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{user.role}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                   <td className="px-6 py-4">
                      <ActionsMenu
                      id={user.id}
                      viewUrl={`/users/view/${user.id}`}
                      onDelete={() => {
                        setDeletingId(user.id)           
                        setShowDeleteConfirm(true)    
                      }}
                        />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      
        </Card>

             {/* Pagination Section */}
      <div className="w-full border-t border-border bg-muted/30 py-4 mt-4">
  <div className="mx-auto flex w-full max-w-7xl flex-col sm:flex-row items-center justify-between gap-4">
    <div className="text-sm text-muted-foreground">
      Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
{filteredUsers.length} users
    </div> 

    <Pagination className="flex justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {[...Array(totalPages)].map((_, i) => (
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={currentPage === i + 1}
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage(i + 1)
              }}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
</div>

        {showDeleteConfirm && (
        <ConfirmationPopover
          action="delete"
          entity="User"
          onConfirm={() => {
            console.log("Confirmed delete user:", deletingId)
            // TODO: Call your delete API here
            setShowDeleteConfirm(false)
            setDeletingId(null)
          }}
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
