"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import UserAvatar from "@/components/ecommerce/user-avatar"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import { ActionsMenu } from "@/components/user-actions-menu"
import { SearchFilterBar } from "@/components/search-filter-bar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import PaginationWrapper from "@/components/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Archive } from "lucide-react"
import { useRouter } from "next/navigation"
// import { api } from "@/lib/api" // TODO: Use this when backend is connected
// import type { User } from "@/types/api" // TODO: Use this when backend is connected

// Local User type for mock data (until backend integration)
interface User {
  id: string
  name: string
  avatar?: string
  username: string
  email: string
  phone: string
  region?: string
  role: string
  status: string
}

const ITEMS_PER_PAGE = 5

export default function UsersManagement() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  // Multi-select bulk filters (checkboxes)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedRolesMulti, setSelectedRolesMulti] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // API State
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // TODO: Replace with real API call when backend is connected
        // const response = await api.get('v1/super-admin/users')
        // setUsers(response.data)
        
        // Mock: Set empty users array for now
        setUsers([])
        
        toast.info('User management connected to backend - no users yet')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filtered users
  const filteredUsers = useMemo(() => {

    const statusFilterEnabled = true

    return users.filter((user) => {
      const matchesSearch =
        [user.name, user.email, user.username].some((field) =>
          field.toLowerCase().includes(searchQuery.toLowerCase())
        )

      const matchesRole =
        selectedRolesMulti.length > 0
          ? selectedRolesMulti.includes(user.role)
          : true

      let matchesStatus = true
      if (selectedStatuses.length > 0) {
        matchesStatus = selectedStatuses.includes(user.status)
      } else {
        if (statusFilter === "All") {
          matchesStatus = statusFilterEnabled ? user.status === "Active" : true
        } else {
          matchesStatus = user.status === statusFilter
        }
      }

      const matchesRegion = selectedRegions.length > 0 ? selectedRegions.includes(user.region || '') : true

      return matchesSearch && matchesRole && matchesStatus && matchesRegion
    })
  }, [users, searchQuery, statusFilter, selectedStatuses, selectedRolesMulti, selectedRegions])

  // Pagination logic
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleArchive = () => {
    // In a real app we'd call the archive API here. For now, navigate to the archive page.
    const id = deletingId
    setShowArchiveConfirm(false)
    setDeletingId(null)
    toast.success("User archived — opening archive page")
    // navigate to the archive page and include the archived id as a query param
    if (id) router.push(`/mash-market/user/archive?id=${id}`)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full space-y-4">
        {/* Header */}
        <header>
          <h1 className="sm:text-3xl text-2xl font-bold">Users Management</h1>
          <p className="text-muted-foreground mt-1 mb-5 sm:text-base text-sm">Accounts Overview</p>
        </header>

        {/* Loading State */}
        {loading && (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading users...</span>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="p-8">
            <div className="text-center">
              <p className="text-destructive mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </Card>
        )}

        {/* Main Content - Only show when not loading and no error */}
        {!loading && !error && (
          <>
        {/* Search and Filters */}
        <div className="flex items-center">
          <div className="flex-1">
            <div className="flex items-center">
              <div className="flex-1 -mb-6">
                <SearchFilterBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  placeholder="Search by name, email, or username..."
                />
              </div>

              {/* Bulk filters as a dropdown - matches requested design */}
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center py-4.5">
                      <span className="font-medium">Filters</span>
                      { (selectedStatuses.length + selectedRolesMulti.length) > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">
                            {selectedStatuses.length + selectedRolesMulti.length + selectedRegions.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-64 p-2">
                    <DropdownMenuLabel>Area / Status</DropdownMenuLabel>
                    <div className="px-1">
                      <div className="text-xs mb-1 text-muted-foreground">Status</div>
                      <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                        <input
                          type="checkbox"
                          className="rounded-sm"
                          checked={selectedStatuses.includes("Active")}
                          onChange={(e) => {
                            const val = e.target.checked
                            setCurrentPage(1)
                            setSelectedStatuses((prev) => (val ? Array.from(new Set([...prev, "Active"])) : prev.filter((s) => s !== "Active")))
                          }}
                        />
                        <span className="text-sm">Active</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                        <input
                          type="checkbox"
                          className="rounded-sm"
                          checked={selectedStatuses.includes("Inactive")}
                          onChange={(e) => {
                            const val = e.target.checked
                            setCurrentPage(1)
                            setSelectedStatuses((prev) => (val ? Array.from(new Set([...prev, "Inactive"])) : prev.filter((s) => s !== "Inactive")))
                          }}
                        />
                        <span className="text-sm">Inactive</span>
                      </label>
                    </div>

                    <DropdownMenuSeparator />

                      <DropdownMenuLabel>Region</DropdownMenuLabel>
                      <div className="px-1">
                        <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                          <input
                            type="checkbox"
                            className="rounded-sm"
                            checked={selectedRegions.includes("Caloocan")}
                            onChange={(e) => {
                              const val = e.target.checked
                              setCurrentPage(1)
                              setSelectedRegions((prev) => (val ? Array.from(new Set([...prev, "Caloocan"])) : prev.filter((r) => r !== "Caloocan")))
                            }}
                          />
                          <span className="text-sm">Caloocan</span>
                        </label>
                        <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                          <input
                            type="checkbox"
                            className="rounded-sm"
                            checked={selectedRegions.includes("Manila")}
                            onChange={(e) => {
                              const val = e.target.checked
                              setCurrentPage(1)
                              setSelectedRegions((prev) => (val ? Array.from(new Set([...prev, "Manila"])) : prev.filter((r) => r !== "Manila")))
                            }}
                          />
                          <span className="text-sm">Manila</span>
                        </label>
                        <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                          <input
                            type="checkbox"
                            className="rounded-sm"
                            checked={selectedRegions.includes("Quezon City")}
                            onChange={(e) => {
                              const val = e.target.checked
                              setCurrentPage(1)
                              setSelectedRegions((prev) => (val ? Array.from(new Set([...prev, "Quezon City"])) : prev.filter((r) => r !== "Quezon City")))
                            }}
                          />
                          <span className="text-sm">Quezon City</span>
                        </label>
                      </div>

                      <DropdownMenuSeparator />

                      <DropdownMenuLabel>Role</DropdownMenuLabel>
                    <div className="px-1">
                      <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                        <input
                          type="checkbox"
                          className="rounded-sm"
                          checked={selectedRolesMulti.includes("Seller")}
                          onChange={(e) => {
                            const val = e.target.checked
                            setCurrentPage(1)
                            setSelectedRolesMulti((prev) => (val ? Array.from(new Set([...prev, "Seller"])) : prev.filter((r) => r !== "Seller")))
                          }}
                        />
                        <span className="text-sm">Seller</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                        <input
                          type="checkbox"
                          className="rounded-sm"
                          checked={selectedRolesMulti.includes("Customer")}
                          onChange={(e) => {
                            const val = e.target.checked
                            setCurrentPage(1)
                            setSelectedRolesMulti((prev) => (val ? Array.from(new Set([...prev, "Customer"])) : prev.filter((r) => r !== "Customer")))
                          }}
                        />
                        <span className="text-sm">Customer</span>
                      </label>
                    </div>

                    <DropdownMenuSeparator />

                    <div className="px-1">
                      <DropdownMenuItem
                        onSelect={() => {
                          // select all
                          setSelectedStatuses(["Active", "Inactive"])
                          setSelectedRolesMulti(["Seller", "Customer"])
                            setSelectedRegions(["Caloocan", "Manila", "Quezon City", "Makati", "Pasig"])
                          setCurrentPage(1)
                        }}
                      >
                        Select all
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          // clear
                          setSelectedStatuses([])
                          setSelectedRolesMulti([])
                            setSelectedRegions([])
                          setStatusFilter("All")
                          setCurrentPage(1)
                        }}
                      >
                        Clear
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Archive icon */}
          <div className="flex items-center -mt-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/mash-market/user/archive")} aria-label="View archives">
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>


        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <tr>
                    {["Profile", "Name", "Username", "Email", "Phone", "Region", "Role", "Actions"].map((h) => (
                    <TableHead key={h}>
                      {h}
                    </TableHead>
                  ))}
                </tr>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-6 py-4"><UserAvatar initials={user.avatar || 'U'} /></TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm truncate">{user.username}</TableCell>
                    <TableCell className="whitespace-nowrap truncate">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap truncate">{user.phone}</TableCell>
                    <TableCell className="whitespace-nowrap">{user.region || 'N/A'}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <ActionsMenu
                        id={user.id}
                        // navigate to the new detail page for this user
                        viewUrl={`/mash-market/user/${user.id}`}
                        onArchive={() => {
                          setDeletingId(user.id)
                          setShowArchiveConfirm(true)
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

        {/* Archive Confirmation */}
        {showArchiveConfirm && (
          <ConfirmationPopover
            action="Archive"
            entity="User"
            onConfirm={handleArchive}
            onCancel={() => {
              setShowArchiveConfirm(false)
              setDeletingId(null)
            }}
          />
        )}
        </>
        )}

      </div>
    </div>
  )
}