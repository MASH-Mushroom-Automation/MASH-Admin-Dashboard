"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import UserAvatar from "@/components/ecommerce/user-avatar"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import { ActionsMenu } from "@/components/user-actions-menu"
import { SearchFilterBar } from "@/components/search-filter-bar"
import {
<<<<<<< HEAD
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
=======
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
>>>>>>> FE-mashmarket


interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: "Seller" | "Customer"
  status: "Active" | "Inactive"
  avatar: string
  region?: string
   // customer-specific
  preferredPaymentMethod?: string
  addressBook?: string[]
  // seller-specific
  businessName?: string
  businessAddress?: string
  businessType?: string
  taxId?: string
  businessDocuments?: string[]
} 

const MOCK_USERS: User[] = [
  { id: "1",
     name: "Sarah Johnson", 
     username: "sarahjohn", 
     email: "sarah@example.com", 
    phone: "+639171234567", 
     role: "Seller", 
     status: "Active", 
  region: "Caloocan",
     avatar: "SJ", 
     businessName: "Sarah's Store", 
     businessAddress: "123 Main St, Anytown, USA", 
     businessType: "Retail", 
     taxId: "123-45-6789", 
     businessDocuments: ["license.pdf", "tax_certificate.pdf"]
    },
  { id: "2", 
     name: "Emma Davis", 
     username: "emmadavis", 
     email: "emma@example.com", 
    phone: "+639173456789", 
     role: "Customer", 
     status: "Inactive", 
    region: "Manila",
     avatar: "ED", 
     preferredPaymentMethod: "Credit Card", 
     addressBook: ["Home: 456 Elm St, Anytown, USA"]
    },
  { id: "3", 
     name: "Sophie Brown", 
     username: "sophieb", 
     email: "sophie@example.com", 
    phone: "+639177890123", 
     role: "Customer", 
     status: "Active", 
    region: "Quezon City",
     avatar: "SB", 
     preferredPaymentMethod: "PayPal", 
     addressBook: ["Work: 789 Oak St, Anytown, USA"]
    },
  { id: "4", 
     name: "Liam Carter", 
     username: "liamc", 
     email: "liam@example.com", 
    phone: "+639171112222", 
     role: "Seller", 
     status: "Active", 
    region: "Makati",
     avatar: "LC", 
     businessName: "Liam's Shop", 
     businessAddress: "456 Maple St, Anytown, USA", 
     businessType: "Retail", 
     taxId: "987-65-4321", 
     businessDocuments: ["business_license.pdf"]
    },
  { id: "5", 
     name: "Ava Thompson", 
     username: "avath", 
     email: "ava@example.com", 
    phone: "+639173334444", 
     role: "Customer", 
     status: "Inactive", 
    region: "Pasig",
     avatar: "AT", 
     preferredPaymentMethod: "Credit Card", 
     addressBook: ["Home: 123 Pine St, Anytown, USA"]
    },
  { id: "6", 
     name: "Noah Walker", 
     username: "noahw", 
     email: "noah@example.com", 
    phone: "+639175556666", 
     role: "Customer", 
     status: "Active", 
    region: "Caloocan",
     avatar: "NW", 
     preferredPaymentMethod: "Credit Card", 
     addressBook: ["Home: 123 Birch St, Anytown, USA"]
    },
  { id: "7", 
     name: "Olivia Martin", 
     username: "oliviam", 
     email: "olivia@example.com", 
    phone: "+639177788888", 
     role: "Seller", 
     status: "Active", 
    region: "Manila",
     avatar: "OM", 
     businessName: "Olivia's Boutique", 
     businessAddress: "789 Cedar St, Anytown, USA", 
     businessType: "Retail", 
     taxId: "456-78-9012", 
     businessDocuments: ["business_license.pdf"]
    },
]

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
  


  // Filtered users
  const filteredUsers = useMemo(() => {

    const statusFilterEnabled = true

    return MOCK_USERS.filter((user) => {
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

      const matchesRegion = selectedRegions.length > 0 ? selectedRegions.includes((user as any).region) : true

      return matchesSearch && matchesRole && matchesStatus && matchesRegion
    })
  }, [searchQuery, statusFilter, selectedStatuses, selectedRolesMulti, selectedRegions])

  // Pagination logic
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

<<<<<<< HEAD
  // Uncomment if needed for filter changes
  // const handleFilterChange = (callback: () => void) => {
  //   setCurrentPage(1)
  //   callback()
  // }
=======
  const handleArchive = () => {
    // In a real app we'd call the archive API here. For now, navigate to the archive page.
    const id = deletingId
    setShowArchiveConfirm(false)
    setDeletingId(null)
    toast.success("User archived — opening archive page")
    // navigate to the archive page and include the archived id as a query param
    if (id) router.push(`/mash-market/user/archive?id=${id}`)
  }
>>>>>>> FE-mashmarket

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <header>
          <h1 className="sm:text-3xl text-2xl font-bold">Users Management</h1>
          <p className="text-muted-foreground mt-1 mb-5 sm:text-base text-sm">Accounts Overview</p>
        </header>

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
                    <TableCell className="px-6 py-4"><UserAvatar initials={user.avatar} /></TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm truncate">{user.username}</TableCell>
                    <TableCell className="whitespace-nowrap truncate">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap truncate">{user.phone}</TableCell>
                    <TableCell className="whitespace-nowrap">{(user as any).region}</TableCell>
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

      </div>
    </div>
  )
}
