"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import UserAvatar from "@/components/ecommerce/user-avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserById } from "@/hooks/useUsers";
import { ArrowLeft } from "lucide-react";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: "Seller" | "Customer";
  status: "Active" | "Inactive";
  avatar: string;
  preferredPaymentMethod?: string;
  addressBook?: string[];
  // Seller-specific fields (expanded)
  businessName?: string;
  businessAddress?: string;
  businessType?: string;
  taxId?: string;
  businessDocuments?: string[];
  // Contact breakdown
  city?: string;
  region?: string;
  completeAddress?: string;
  // Product info
  typesOfMushroom?: string[];
  monthlyProductionCapacity?: string;
  certifications?: string[];
  // Banking
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

export default function UserViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: username } = use(params);
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const {
    data: selectedUser,
    isLoading: loading,
    error,
  } = useUserById(userId as string);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">
                Loading user details...
              </span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // No ID provided in query params
  if (!userId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-destructive">
              Invalid URL
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              User ID is missing from the URL. Please navigate from the user
              list.
            </p>
            <div className="mt-4">
              <Link href="/mash-market/user">
                <Button>Back to users</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-destructive">Error</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {(error as Error).message}
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/mash-market/user">
                <Button variant="ghost">Back to users</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // User not found state
  if (!selectedUser && !loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium">User not found</h2>
            <p className="text-sm text-muted-foreground mt-2">
              We could not find a user with that id.
            </p>
            <div className="mt-4">
              <Link href="/mash-market/user">
                <Button>Back to users</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const user = selectedUser!;

  // Map role to display format (handle both "user" and "USER" from API)
  const role =
    user.role?.toLowerCase() === "user"
      ? "Customer"
      : user.role === "ADMIN"
        ? "Seller"
        : user.role || "Customer";

  return (
    <div className="bg-background p-6 ">
      <div className="mb-6">
        <Link href="/mash-market/user">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <UserAvatar
                initials={
                  user.avatar || user.name?.substring(0, 2).toUpperCase() || "U"
                }
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="text-sm text-muted-foreground">
                {role === "Seller" ? "Seller profile" : "Customer profile"}
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {role === "Customer" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <Input
                    value={user.name ?? ""}
                    disabled
                    readOnly
                    aria-readonly
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <Input
                    value={user.username ?? ""}
                    disabled
                    readOnly
                    aria-readonly
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <Input
                    value={user.email ?? ""}
                    disabled
                    readOnly
                    aria-readonly
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <Input
                    value={user.phone ?? ""}
                    disabled
                    readOnly
                    aria-readonly
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <Input
                    value={user.role ?? ""}
                    disabled
                    readOnly
                    aria-readonly
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Preferred Payment Method
                  </label>
                  <Input
                    value={user.preferredPaymentMethod ?? "-"}
                    disabled
                    readOnly
                    aria-readonly
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    City
                  </label>
                  <Input
                    value={user.city ?? ""}
                    disabled
                    readOnly
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Region
                  </label>
                  <Input
                    value={user.region ?? ""}
                    disabled
                    readOnly
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2 mt-4">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Complete address
                  </label>
                  <Input
                    value={
                      user.completeAddress ??
                      (user.addressBook && user.addressBook.length > 0
                        ? user.addressBook[0]
                        : "")
                    }
                    disabled
                    readOnly
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {role === "Seller" && (
              <div className="space-y-6">
                {/* Business Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">
                    Business Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Business Name
                      </label>
                      <Input
                        value={user.businessName ?? ""}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Business Classification
                      </label>
                      <Input
                        value={user.businessType ?? ""}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Industry Category
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        TAX ID Number
                      </label>
                      <Input
                        value={user.taxId ?? ""}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Business Registration Number / Permit Number
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Years in Operation
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Business Description
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Building/Street
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Barangay
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Province
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        ZIP Code
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">Contact Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Full name
                      </label>
                      <Input
                        value={user.name ?? ""}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Email address
                      </label>
                      <Input
                        value={user.email ?? ""}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Phone number
                      </label>
                      <Input
                        value={user.phone ?? ""}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Alternative / Secondary Contact Number
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Contact Person Position/Role
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">
                    Product Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Varieties
                      </label>
                      <Input
                        value={(user.typesOfMushroom || []).join(", ")}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Product Formats
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Average Monthly Output
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Maximum Capacity
                      </label>
                      <Input
                        value={user.monthlyProductionCapacity ?? ""}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Pricing Range
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Min. Order Quantity (MOQ)
                      </label>
                      <Input value="" disabled readOnly className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Business Documents */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">
                    Business Documents
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Documents required for verification.
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    {/** Government ID */}
                    <div className="border rounded-md p-3 flex flex-col items-start">
                      <div className="text-sm font-medium">
                        Valid ID of Business Owner
                      </div>
                      <div className="mt-2 w-full h-32 bg-gray-100 border flex items-center justify-center">
                        <span className="text-gray-500">📄 Document</span>
                      </div>
                      <div className="mt-3 w-full">
                        <Button size="sm" className="mt-2">
                          View
                        </Button>
                      </div>
                    </div>

                    {/** BIR Certificate */}
                    <div className="border rounded-md p-3 flex flex-col items-start">
                      <div className="text-sm font-medium">BIR Certificate</div>
                      <div className="mt-2 w-full h-32 bg-gray-100 border flex items-center justify-center">
                        <span className="text-gray-500">📄 PDF</span>
                      </div>
                      <div className="mt-3 w-full">
                        <Button size="sm" className="mt-2">
                          View
                        </Button>
                      </div>
                    </div>

                    {/** Business Certificate */}
                    <div className="border rounded-md p-3 flex flex-col items-start">
                      <div className="text-sm font-medium">
                        Business Certificate
                      </div>
                      <div className="mt-2 w-full h-32 bg-gray-100 border flex items-center justify-center">
                        <span className="text-gray-500">📄 PDF</span>
                      </div>
                      <div className="mt-3 w-full">
                        <Button size="sm" className="mt-2">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
