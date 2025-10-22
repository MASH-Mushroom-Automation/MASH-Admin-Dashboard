"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import UserAvatar from "@/components/ecommerce/user-avatar"
import StatusBadge from "@/components/ecommerce/status-badge"

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
    name: "Michael Chen",
    username: "mchen92",
    email: "michael@example.com",
    phone: "+1 (555) 234-5678",
    role: "Seller",
    status: "Active",
    avatar: "MC",
  },
  {
    id: "3",
    name: "Emma Davis",
    username: "emmadavis",
    email: "emma@example.com",
    phone: "+1 (555) 345-6789",
    role: "User",
    status: "Inactive",
    avatar: "ED",
  },
  {
    id: "4",
    name: "James Wilson",
    username: "jwilson",
    email: "james@example.com",
    phone: "+1 (555) 456-7890",
    role: "Seller",
    status: "Active",
    avatar: "JW",
  },
  {
    id: "5",
    name: "Lisa Anderson",
    username: "lisaand",
    email: "lisa@example.com",
    phone: "+1 (555) 567-8901",
    role: "User",
    status: "Active",
    avatar: "LA",
  },
  {
    id: "6",
    name: "David Martinez",
    username: "dmartinez",
    email: "david@example.com",
    phone: "+1 (555) 678-9012",
    role: "Admin",
    status: "Active",
    avatar: "DM",
  },
  {
    id: "7",
    name: "Sophie Brown",
    username: "sophieb",
    email: "sophie@example.com",
    phone: "+1 (555) 789-0123",
    role: "User",
    status: "Active",
    avatar: "SB",
  },
  {
    id: "8",
    name: "Robert Taylor",
    username: "rtaylor",
    email: "robert@example.com",
    phone: "+1 (555) 890-1234",
    role: "Seller",
    status: "Inactive",
    avatar: "RT",
  },
  {
    id: "9",
    name: "Jessica Lee",
    username: "jlee",
    email: "jessica@example.com",
    phone: "+1 (555) 901-2345",
    role: "User",
    status: "Active",
    avatar: "JL",
  },
  {
    id: "10",
    name: "Christopher White",
    username: "cwhite",
    email: "chris@example.com",
    phone: "+1 (555) 012-3456",
    role: "Admin",
    status: "Active",
    avatar: "CW",
  },
]

const ITEMS_PER_PAGE = 5

function DeleteConfirmationPopover({
  isOpen,
  onConfirm,
  onCancel,
  userName,
}: {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  userName: string
}) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div ref={popoverRef} className="w-96 rounded-lg border border-border bg-background p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Delete User</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-medium text-foreground">{userName}</span>? This action
          cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onCancel()
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function ActionMenu({ userId, userName }: { userId: string; userName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-background shadow-lg z-50">
            <button
              onClick={() => {
                console.log("Edit user:", userId)
                setIsOpen(false)
              }}
              className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors first:rounded-t-md"
            >
              Edit
            </button>
            <button
              onClick={() => {
                console.log("Deactivate user:", userId)
                setIsOpen(false)
              }}
              className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
            >
              Deactivate
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(true)
                setIsOpen(false)
              }}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors last:rounded-b-md"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <DeleteConfirmationPopover
        isOpen={showDeleteConfirm}
        userName={userName}
        onConfirm={() => {
          console.log("Confirmed delete user:", userId)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
        </div>

        {/* Search and Filters Section */}
        <Card className="mb-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => handleFilterChange(() => setRoleFilter(e.target.value as typeof roleFilter))}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Seller">Seller</option>
              <option value="User">User</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(() => setStatusFilter(e.target.value as typeof statusFilter))}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </Card>

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
                      <ActionMenu userId={user.id} userName={user.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
