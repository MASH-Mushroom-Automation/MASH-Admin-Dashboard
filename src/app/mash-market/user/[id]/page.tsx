"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import UserAvatar from "@/components/ecommerce/user-avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserById } from "@/hooks/useUsers";
import { useSellers, useSellerById } from "@/hooks/useSellers";
import { useGrowUsers } from "@/hooks/useGrowUsers";
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

  const normalizedRole = String(selectedUser?.role || "").toUpperCase();
  const isSellerRole = normalizedRole === "ADMIN" || normalizedRole === "SELLER";
  const isGrowerRole = normalizedRole === "GROWER";

  const { data: sellerApplications = [] } = useSellers(
    selectedUser?.id && isSellerRole ? { userId: selectedUser.id } : undefined,
    Boolean(selectedUser?.id && isSellerRole),
  );

  const sellerRequestId = sellerApplications?.[0]?.requestId || "";
  const { data: sellerApplicationDetail } = useSellerById(sellerRequestId);

  const { data: growUsers = [] } = useGrowUsers(
    undefined,
    Boolean(selectedUser?.id && isGrowerRole),
  );

  const growerDetail = growUsers.find(
    (growUser) =>
      growUser.id === selectedUser?.id ||
      (selectedUser?.email && growUser.email === selectedUser.email),
  );

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
  const role = isSellerRole ? "Seller" : isGrowerRole ? "Grower" : "Buyer";

  const sellerBusinessName =
    sellerApplicationDetail?.businessInfo?.businessName || user.businessName || "";
  const sellerBusinessType =
    sellerApplicationDetail?.businessInfo?.businessType || user.businessType || "";
  const sellerTaxId =
    sellerApplicationDetail?.businessInfo?.taxIdNumber || user.taxId || "";
  const sellerAddress =
    sellerApplicationDetail?.contactInfo?.completeAddress ||
    sellerApplicationDetail?.businessInfo?.businessAddress ||
    user.completeAddress ||
    user.businessAddress ||
    "";
  const sellerCity =
    sellerApplicationDetail?.contactInfo?.city || user.city || "";
  const sellerRegion =
    sellerApplicationDetail?.contactInfo?.region || user.region || "";
  const sellerMushroomTypes =
    sellerApplicationDetail?.productInfo?.typesOfMushrooms ||
    user.typesOfMushroom ||
    [];
  const sellerMonthlyCapacity =
    sellerApplicationDetail?.productInfo?.monthlyProductionCapacity ||
    user.monthlyProductionCapacity ||
    "";
  const sellerCertifications =
    sellerApplicationDetail?.productInfo?.certifications ||
    user.certifications ||
    [];

  const sellerDocumentItems = [
    {
      label: "Valid ID of Business Owner",
      url: sellerApplicationDetail?.documents?.governmentId,
    },
    {
      label: "BIR Certificate",
      url: sellerApplicationDetail?.documents?.birCertificate,
    },
    {
      label: "Business Certificate",
      url: sellerApplicationDetail?.documents?.businessCertificate,
    },
  ].filter((item) => Boolean(item.url));

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
                {role === "Seller"
                  ? "Seller profile"
                  : role === "Grower"
                    ? "Grower profile"
                    : "Buyer profile"}
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {role === "Buyer" && (
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
                    value={user.preferredPaymentMethod ?? ""}
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
                        value={sellerBusinessName}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Business Type
                      </label>
                      <Input
                        value={sellerBusinessType}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        TAX ID Number
                      </label>
                      <Input
                        value={sellerTaxId}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        City
                      </label>
                      <Input value={sellerCity} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Region
                      </label>
                      <Input value={sellerRegion} disabled readOnly className="mt-1" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Complete Address
                      </label>
                      <Input value={sellerAddress} disabled readOnly className="mt-1" />
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
                        value={sellerMushroomTypes.join(", ")}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Monthly Production Capacity
                      </label>
                      <Input
                        value={sellerMonthlyCapacity}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Certifications
                      </label>
                      <Input
                        value={sellerCertifications.join(", ")}
                        disabled
                        readOnly
                        className="mt-1"
                      />
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

                  {sellerDocumentItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No uploaded documents found in this seller application record.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {sellerDocumentItems.map((item) => {
                        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(
                          String(item.url),
                        );

                        return (
                          <div
                            key={item.label}
                            className="border rounded-md p-3 flex flex-col items-start"
                          >
                            <div className="text-sm font-medium">{item.label}</div>
                            <div className="mt-2 w-full h-32 bg-gray-100 border flex items-center justify-center">
                              {isImage ? (
                                <img
                                  src={String(item.url)}
                                  alt={item.label}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full" />
                              )}
                            </div>
                            <div className="mt-3 w-full">
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => window.open(String(item.url), "_blank")}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {role === "Grower" && (
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-3">Grower Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Full Name</label>
                      <Input value={user.name ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Email</label>
                      <Input value={user.email ?? ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Phone Number</label>
                      <Input
                        value={growerDetail?.contactNumber || growerDetail?.phoneNumber || user.phone || ""}
                        disabled
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Chamber Number</label>
                      <Input value={growerDetail?.chamberNumber || ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Device ID</label>
                      <Input value={growerDetail?.deviceId || ""} disabled readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Address</label>
                      <Input value={growerDetail?.address || user.completeAddress || ""} disabled readOnly className="mt-1" />
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
