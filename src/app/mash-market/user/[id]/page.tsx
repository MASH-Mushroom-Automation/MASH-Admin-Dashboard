import React, { use } from "react"
import Link from "next/link"
import UserAvatar from "@/components/ecommerce/user-avatar"
import StatusBadge from "@/components/status-badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: "Seller" | "Customer"
  status: "Active" | "Inactive"
  avatar: string
  preferredPaymentMethod?: string
  addressBook?: string[]
  // Seller-specific fields (expanded)
  businessName?: string
  businessAddress?: string
  businessType?: string
  taxId?: string
  businessDocuments?: string[]
  // Contact breakdown
  city?: string
  region?: string
  completeAddress?: string
  // Product info
  typesOfMushroom?: string[]
  monthlyProductionCapacity?: string
  certifications?: string[]
  // Banking
  bankName?: string
  accountNumber?: string
  accountHolderName?: string
}

const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    username: "sarahjohn",
    email: "sarah@example.com",
    phone: "+1 (555) 123-4567",
    role: "Seller",
    status: "Active",
    avatar: "SJ",
    businessName: "Sarah's Store",
    businessAddress: "123 Main St, Anytown, USA",
    businessType: "company",
    taxId: "123-45-6789",
    businessDocuments: ["license.pdf", "tax_certificate.pdf"],
    city: "Anytown",
    region: "Region 1",
    completeAddress: "123 Main St, Anytown, USA",
    typesOfMushroom: ["White oyster mushroom", "Shiitake"],
    monthlyProductionCapacity: "1,000 kg",
    certifications: ["GAP"],
    bankName: "Bank A",
    accountNumber: "111222333",
    accountHolderName: "Sarah's Store",
  },
  {
    id: "2",
    name: "Emma Davis",
    username: "emmadavis",
    email: "emma@example.com",
    phone: "+1 (555) 345-6789",
    role: "Customer",
    status: "Inactive",
    avatar: "ED",
    preferredPaymentMethod: "Credit Card",
    addressBook: ["Home: 456 Elm St, Manila, Philippines"],
    city: "Manila",
    region: "NCR",
    completeAddress: "456 Elm St, Manila, Philippines",
  },
  {
    id: "3",
    name: "Sophie Brown",
    username: "sophieb",
    email: "sophie@example.com",
    phone: "+1 (555) 789-0123",
    role: "Customer",
    status: "Active",
    avatar: "SB",
    preferredPaymentMethod: "PayPal",
    addressBook: ["Work: 789 Oak St, Quezon City, Philippines"],
    city: "Quezon City",
    region: "NCR",
    completeAddress: "789 Oak St, Quezon City, Philippines",
  },
  {
    id: "4",
    name: "Liam Carter",
    username: "liamc",
    email: "liam@example.com",
    phone: "+1 (555) 111-2222",
    role: "Seller",
    status: "Active",
    avatar: "LC",
    businessName: "Liam's Shop",
    businessAddress: "456 Maple St, Anytown, USA",
    businessType: "individual",
    taxId: "987-65-4321",
    businessDocuments: ["business_license.pdf"],
    city: "Anytown",
    region: "Region 2",
    completeAddress: "456 Maple St, Anytown, USA",
    typesOfMushroom: ["Button mushroom"],
    monthlyProductionCapacity: "300 kg",
    certifications: [],
    bankName: "Bank B",
    accountNumber: "444555666",
    accountHolderName: "Liam Carter",
  },
  {
    id: "5",
    name: "Ava Thompson",
    username: "avath",
    email: "ava@example.com",
    phone: "+1 (555) 333-4444",
    role: "Customer",
    status: "Inactive",
    avatar: "AT",
    preferredPaymentMethod: "Credit Card",
    addressBook: ["Home: 123 Pine St, Makati, Philippines"],
    city: "Makati",
    region: "NCR",
    completeAddress: "123 Pine St, Makati, Philippines",
  },
  {
    id: "6",
    name: "Noah Walker",
    username: "noahw",
    email: "noah@example.com",
    phone: "+1 (555) 555-6666",
    role: "Customer",
    status: "Active",
    avatar: "NW",
    preferredPaymentMethod: "Credit Card",
    addressBook: ["Home: 123 Birch St, Pasig, Philippines"],
    city: "Pasig",
    region: "NCR",
    completeAddress: "123 Birch St, Pasig, Philippines",
  },
  {
    id: "7",
    name: "Olivia Martin",
    username: "oliviam",
    email: "olivia@example.com",
    phone: "+1 (555) 777-8888",
    role: "Seller",
    status: "Active",
    avatar: "OM",
    businessName: "Olivia's Boutique",
    businessAddress: "789 Cedar St, Anytown, USA",
    businessType: "company",
    taxId: "456-78-9012",
    businessDocuments: ["business_license.pdf"],
    city: "Anytown",
    region: "Region 3",
    completeAddress: "789 Cedar St, Anytown, USA",
    typesOfMushroom: ["Lion’s mane"],
    monthlyProductionCapacity: "150 kg",
    certifications: ["Organic"],
    bankName: "Bank C",
    accountNumber: "777888999",
    accountHolderName: "Olivia Martin",
  },
]

export default function UserViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const user = MOCK_USERS.find((u) => u.id === id) ?? null

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium">User not found</h2>
            <p className="text-sm text-muted-foreground mt-2">We couldn't find a user with that id.</p>
            <div className="mt-4">
              <Link href="/mash-market/user">
                <Button>Back to users</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const role = user.role

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0"><UserAvatar initials={user.avatar} /></div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="text-sm text-muted-foreground">{role === "Seller" ? "Seller profile" : "Customer profile"}</div>
            </div>
          </div>
          <div>
            <Link href="/mash-market/user">
              <Button variant="ghost">Back</Button>
            </Link>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {role === "Customer" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Full Name</label>
                  <Input value={user.name ?? ""} disabled readOnly aria-readonly className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Username</label>
                  <Input value={user.username ?? ""} disabled readOnly aria-readonly className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Email</label>
                  <Input value={user.email ?? ""} disabled readOnly aria-readonly className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Phone</label>
                  <Input value={user.phone ?? ""} disabled readOnly aria-readonly className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Role</label>
                  <Input value={user.role ?? ""} disabled readOnly aria-readonly className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Preferred Payment Method</label>
                  <Input value={user.preferredPaymentMethod ?? "-"} disabled readOnly aria-readonly className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">City</label>
                  <Input value={user.city ?? ""} disabled readOnly className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Region</label>
                  <Input value={user.region ?? ""} disabled readOnly className="mt-1" />
                </div>

                <div className="col-span-2 mt-4">
                  <label className="block text-sm font-medium text-muted-foreground">Complete address</label>
                  <Input value={user.completeAddress ?? (user.addressBook && user.addressBook.length > 0 ? user.addressBook[0] : "")} disabled readOnly className="mt-1" />
                </div>
              </div>
            )}

            {role === "Seller" && (
              <div className="space-y-6">
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Business Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Business Name</label>
                      <Input value={user.businessName ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Business Type</label>
                      <Input value={user.businessType ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">TAX ID Number</label>
                      <Input value={user.taxId ?? ""} disabled readOnly className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Contact Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Full name</label>
                      <Input value={user.name ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Email address</label>
                      <Input value={user.email ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Phone number</label>
                      <Input value={user.phone ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">City</label>
                      <Input value={user.city ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Region</label>
                      <Input value={user.region ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground">Complete address</label>
                      <Input value={user.completeAddress ?? user.businessAddress ?? ""} disabled readOnly className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Product information */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Product information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground">Types of mushroom</label>
                      <Input value={(user.typesOfMushroom || []).join(", ")} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Monthly production capacity</label>
                      <Input value={user.monthlyProductionCapacity ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Certifications</label>
                      <Input value={(user.certifications || []).join(", ")} disabled readOnly className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Banking details */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Banking details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Bank name</label>
                      <Input value={user.bankName ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Account number</label>
                      <Input value={user.accountNumber ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground">Account holder name</label>
                      <Input value={user.accountHolderName ?? ""} disabled readOnly className="mt-1" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-2">{user.status ? <StatusBadge status={user.status as any} /> : <span className="text-sm">-</span>}</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}