"use client";

import { useState, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import RejectReasonModal from "@/components/ecommerce/reject-reason-modal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";
import {
  useSellerById,
  useApproveSeller,
  useRejectSeller,
} from "@/hooks/useSellers";

interface Seller {
  id: string;
  name: string;
  storeName?: string;
  username?: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  // Contact
  phone?: string;
  city?: string;
  region?: string;
  completeAddress?: string;
  // Business
  businessName?: string;
  businessType?: "individual" | "company" | string;
  taxIdNumber?: string;
  // Product info
  typesOfMushroom?: string[];
  monthlyProductionCapacity?: string;
  certifications?: string[];
  // Banking
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

export default function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: username } = use(params); // This is the username from URL path
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId"); // This is the requestId from query param
  const router = useRouter();

  const {
    data: selectedApplication,
    isLoading: storeLoading,
    error: storeError,
  } = useSellerById(requestId as string);
  const { mutateAsync: approveApplication } = useApproveSeller();
  const { mutateAsync: rejectApplication } = useRejectSeller();

  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // Loading state
  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">
                Loading seller details...
              </span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // No requestId provided in query params
  if (!requestId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-destructive">
              Invalid URL
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Seller ID is missing from the URL. Please navigate from the seller
              list.
            </p>
            <div className="mt-4">
              <Button onClick={() => router.push("/mash-market/seller")}>
                Back to sellers
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (storeError && !storeLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-destructive">Error</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {(storeError as Error).message || "Failed to load"}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                onClick={() => router.push("/mash-market/seller")}
              >
                Back to sellers
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Wait for selectedApplication to be available (either from cache or fetch)
  if (!selectedApplication) {
    // If no error and not loading, but still no data, it means we're waiting for the effect to run
    if (!storeLoading && !storeError) {
      return (
        <div className="min-h-screen bg-background p-6">
          <div className="mx-auto max-w-4xl">
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">
                  Loading seller details...
                </span>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Only show "not found" if we've tried to load and there's no loading happening
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium">Seller not found</h2>
            <p className="text-sm text-muted-foreground mt-2">
              We could not find a seller with that id.
            </p>
            <div className="mt-4">
              <Button onClick={() => router.push("/mash-market/seller")}>
                Back to sellers
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Map application data to seller format
  const seller: Seller = {
    id: selectedApplication!.requestId,
    name: `${selectedApplication!.user.firstName} ${
      selectedApplication!.user.lastName
    }`,
    username: selectedApplication!.user.username,
    email: selectedApplication!.user.email,
    phone: undefined, // Not in application response
    status:
      (selectedApplication!.status?.toLowerCase() as
        | "pending"
        | "approved"
        | "rejected") || "pending",
    city: undefined,
    region: undefined,
    completeAddress: selectedApplication!.businessInfo.businessAddress,
    // Map business info from application
    storeName: selectedApplication!.businessInfo.businessName,
    businessName: selectedApplication!.businessInfo.businessName,
    businessType: "company",
  };

  const handleAccept = async () => {
    console.log("[SellerDetailPage] Approving seller:", seller.id);

    setLoading(true);
    try {
      await approveApplication({ requestId: seller.id });
      toast.success("Seller application approved successfully");
      router.push("/mash-market/seller");
    } catch (err) {
      console.error("Failed to approve seller:", err);
      toast.error("Failed to approve seller application");
    } finally {
      setLoading(false);
    }
  };

  // Reject using modal reason
  const handleReject = async (reason?: string) => {
    setLoading(true);
    try {
      await rejectApplication({ requestId: seller.id, reason });
      toast.error(`Seller application rejected${reason ? ` — ${reason}` : ""}`);
      router.push("/mash-market/seller");
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject seller application");
    } finally {
      setLoading(false);
      setRejectModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/mash-market/seller")}
        >
          {" "}
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{seller.name}</h1>
            <p className="text-muted-foreground mt-1">Seller profile</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          {/* User Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <Input
                  value={`${selectedApplication.user.firstName} ${selectedApplication.user.lastName}`}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Username
                </label>
                <Input
                  value={selectedApplication.user.username}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <Input
                  value={selectedApplication.user.email}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Phone Number
                </label>
                <Input
                  value={selectedApplication.user.phoneNumber || "N/A"}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Business Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Business Name
                </label>
                <Input
                  value={selectedApplication.businessInfo.businessName || "N/A"}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Business Address
                </label>
                <Input
                  value={
                    selectedApplication.businessInfo.businessAddress || "N/A"
                  }
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Additional Information
                </label>
                <Input
                  value={
                    selectedApplication.businessInfo.additionalInfo || "N/A"
                  }
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Business Documents</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Documents required for verification.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {/* Government ID */}
              {selectedApplication.documents.governmentId && (
                <div className="border rounded-md p-3 flex flex-col items-start">
                  <div className="text-sm font-medium">
                    Valid ID of Business Owner
                  </div>
                  <div className="mt-2 w-full h-32 bg-gray-100 border flex items-center justify-center">
                    {selectedApplication.documents.governmentId.match(
                      /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i,
                    ) ? (
                      <img
                        src={selectedApplication.documents.governmentId}
                        alt="Government ID"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<span class="text-gray-500">📄 Document</span>';
                        }}
                      />
                    ) : (
                      <span className="text-gray-500">📄 Document</span>
                    )}
                  </div>
                  <div className="mt-3 w-full">
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        window.open(
                          selectedApplication.documents.governmentId,
                          "_blank",
                        )
                      }
                    >
                      View
                    </Button>
                  </div>
                </div>
              )}

              {/* BIR Certificate */}
              {selectedApplication.documents.birCertificate && (
                <div className="border rounded-md p-3 flex flex-col items-start">
                  <div className="text-sm font-medium">BIR Certificate</div>
                  <div className="mt-2 w-full h-32 bg-gray-100 border flex items-center justify-center">
                    {selectedApplication.documents.birCertificate.match(
                      /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i,
                    ) ? (
                      <img
                        src={selectedApplication.documents.birCertificate}
                        alt="BIR Certificate"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<span class="text-gray-500">📄 PDF</span>';
                        }}
                      />
                    ) : (
                      <span className="text-gray-500">📄 PDF</span>
                    )}
                  </div>
                  <div className="mt-3 w-full">
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        window.open(
                          selectedApplication.documents.birCertificate,
                          "_blank",
                        )
                      }
                    >
                      View
                    </Button>
                  </div>
                </div>
              )}

              {/* Business Certificate */}
              {selectedApplication.documents.businessCertificate && (
                <div className="border rounded-md p-3 flex flex-col items-start">
                  <div className="text-sm font-medium">
                    Business Certificate
                  </div>
                  <div className="mt-2 w-full h-32 bg-gray-100 border flex items-center justify-center">
                    {selectedApplication.documents.businessCertificate.match(
                      /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i,
                    ) ? (
                      <img
                        src={selectedApplication.documents.businessCertificate}
                        alt="Business Certificate"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<span class="text-gray-500">📄 PDF</span>';
                        }}
                      />
                    ) : (
                      <span className="text-gray-500">📄 PDF</span>
                    )}
                  </div>
                  <div className="mt-3 w-full">
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        window.open(
                          selectedApplication.documents.businessCertificate,
                          "_blank",
                        )
                      }
                    >
                      View
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {seller.status === "pending" && (
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setRejectModalOpen(true)}
                variant="destructive"
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button onClick={handleAccept} disabled={loading}>
                <Check className="mr-2 h-4 w-4" /> Accept
              </Button>
            </div>
          )}
          <RejectReasonModal
            open={rejectModalOpen}
            onOpenChange={setRejectModalOpen}
            onConfirm={(reason) => handleReject(reason)}
          />
        </Card>
      </div>
    </div>
  );
}
