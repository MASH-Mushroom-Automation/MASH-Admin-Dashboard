"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import UserAvatar from "@/components/ecommerce/user-avatar"
import StatusBadge from "@/components/status-badge"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import { ActionsMenu } from "@/components/user-actions-menu"
import UserDetailsModal from "@/components/user-details-modal"
import { SearchFilterBar } from "@/components/search-filter-bar"
import PaginationWrapper from "@/components/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"


interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: "Seller" | "Customer"
  status: "Active" | "Inactive"
  avatar: string
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
     phone: "+1 (555) 123-4567", 
     role: "Seller", 
     status: "Active", 
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
     phone: "+1 (555) 345-6789", 
     role: "Customer", 
     status: "Inactive", 
     avatar: "ED", 
     preferredPaymentMethod: "Credit Card", 
     addressBook: ["Home: 456 Elm St, Anytown, USA"]
    },
  { id: "3", 
     name: "Sophie Brown", 
     username: "sophieb", 
     email: "sophie@example.com", 
     phone: "+1 (555) 789-0123", 
     role: "Customer", 
     status: "Active", 
     avatar: "SB", 
     preferredPaymentMethod: "PayPal", 
     addressBook: ["Work: 789 Oak St, Anytown, USA"]
    },
  { id: "4", 
     name: "Liam Carter", 
     username: "liamc", 
     email: "liam@example.com", 
     phone: "+1 (555) 111-2222", 
     role: "Seller", 
     status: "Active", 
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
     phone: "+1 (555) 333-4444", 
     role: "Customer", 
     status: "Inactive", 
     avatar: "AT", 
     preferredPaymentMethod: "Credit Card", 
     addressBook: ["Home: 123 Pine St, Anytown, USA"]
    },
  { id: "6", 
     name: "Noah Walker", 
     username: "noahw", 
     email: "noah@example.com", 
     phone: "+1 (555) 555-6666", 
     role: "Customer", 
     status: "Active", 
     avatar: "NW", 
     preferredPaymentMethod: "Credit Card", 
     addressBook: ["Home: 123 Birch St, Anytown, USA"]
    },
  { id: "7", 
     name: "Olivia Martin", 
     username: "oliviam", 
     email: "olivia@example.com", 
     phone: "+1 (555) 777-8888", 
     role: "Seller", 
     status: "Active", 
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
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"All" | "Seller" | "Customer">("All")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)


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
    // show toast after deletion
    toast.success("User deleted successfully")
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
            { value: "Seller", label: "Seller" },
            { value: "Customer", label: "Customer" },
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
                    <TableCell className="whitespace-nowrap text-sm truncate">{user.username}</TableCell>
                    <TableCell className="whitespace-nowrap truncate">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap truncate">{user.phone}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell><StatusBadge status={user.status} /></TableCell>
                    <TableCell>
                      <ActionsMenu
                        id={user.id}
                        viewUrl={`/users/view/${user.id}`}
                        onView={() => {
                          setSelectedUser(user)
                          setShowUserModal(true)
                        }}
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

        {/* User Details Modal */}
        <UserDetailsModal
          open={showUserModal}
          onOpenChange={(open) => {
            setShowUserModal(open)
            if (!open) setSelectedUser(null)
          }}
          user={selectedUser}
        />
      </div>
    </div>
  )
}
