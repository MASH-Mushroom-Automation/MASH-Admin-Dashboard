"use client";

import { useState, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import RejectReasonModal from "@/components/ecommerce/reject-reason-modal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { useSellerApplicationStore } from "@/store/sellerApplicationStore";

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

const mockSellers: Seller[] = [
  {
    id: "1",
    name: "John Doe",
    username: "johndoe",
    storeName: "Smith Mushrooms",
    businessName: "Smith Mushrooms",
    businessType: "company",
    taxIdNumber: "TAX-0012345",
    email: "john@smithmushrooms.com",
    phone: "+63 912 345 6789",
    city: "Caloocan City",
    region: "NCR",
    completeAddress: "1234 Mushroom St, Barangay 1, Caloocan",
    status: "pending",
    typesOfMushroom: ["White oyster mushroom", "Shiitake", "Enoki"],
    monthlyProductionCapacity: "2,000 kg",
    certifications: ["Good Agricultural Practices"],
    bankName: "Bank of Manila",
    accountNumber: "1234567890",
    accountHolderName: "Smith Mushrooms Inc",
  },
  {
    id: "2",
    name: "Karen Smith",
    username: "karen_s",
    storeName: "Karen Boutique",
    businessName: "Karen Boutique",
    businessType: "individual",
    taxIdNumber: "TAX-987654",
    email: "karen@boutique.com",
    phone: "+63 912 000 1111",
    city: "Quezon City",
    region: "NCR",
    completeAddress: "56 Fashion Ave, Quezon City",
    status: "approved",
    typesOfMushroom: ["Button mushroom"],
    monthlyProductionCapacity: "500 kg",
    certifications: ["Organic"],
    bankName: "First National Bank",
    accountNumber: "0987654321",
    accountHolderName: "Karen S",
  },
  {
    id: "3",
    name: "Anne Curtis",
    username: "annec",
    storeName: "Anne Beauty Hub",
    businessName: "Anne Beauty Hub",
    businessType: "company",
    taxIdNumber: "TAX-555666",
    email: "anne@beautyhub.com",
    phone: "+63 912 222 3333",
    city: "Makati City",
    region: "NCR",
    completeAddress: "78 Beauty Rd, Makati",
    status: "rejected",
    typesOfMushroom: ["Lion’s mane"],
    monthlyProductionCapacity: "200 kg",
    certifications: [],
    bankName: "Metro Bank",
    accountNumber: "555666777",
    accountHolderName: "Anne C",
  },
];

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
    selectedApplication,
    loading: storeLoading,
    error: storeError,
    fetchApplicationById,
    approveApplication,
    rejectApplication,
    clearSelectedApplication,
  } = useSellerApplicationStore();
  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // Fetch seller application data if not already loaded
  useEffect(() => {
    if (requestId && !selectedApplication) {
      console.log(
        "[SellerDetailPage] Fetching seller application with requestId:",
        requestId,
        "| Username in URL:",
        username
      );
      fetchApplicationById(requestId);
    } else if (requestId && selectedApplication?.requestId !== requestId) {
      console.log(
        "[SellerDetailPage] RequestId mismatch, refetching:",
        requestId
      );
      fetchApplicationById(requestId);
    } else if (!requestId) {
      console.warn("[SellerDetailPage] No requestId provided in query params");
    } else {
      console.log(
        "[SellerDetailPage] Using cached application data:",
        selectedApplication?.requestId
      );
    }

    // Cleanup: clear selected application when leaving page
    return () => {
      clearSelectedApplication();
    };
    // Only depend on requestId and username, not selectedApplication to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, username]);

  // Loading state
  if (storeLoading.selectedApplication) {
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
  if (storeError.selectedApplication && !storeLoading.selectedApplication) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-destructive">Error</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {storeError.selectedApplication}
            </p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => fetchApplicationById(requestId)}>
                Retry
              </Button>
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
    if (!storeLoading.selectedApplication && !storeError.selectedApplication) {
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
    setLoading(true);
    try {
      await approveApplication(seller.id);
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
      await rejectApplication(seller.id, reason);
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
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{seller.name}</h1>
            <p className="text-muted-foreground mt-1">Seller profile</p>
          </div>
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/mash-market/seller")}
            >
              Back
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          {/* Business Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Business Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Business Name
                </label>
                <Input
                  value={seller.businessName ?? ""}
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
                  value={seller.businessType ?? ""}
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
                  value={seller.taxIdNumber ?? ""}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-medium mb-3">Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Full name
                </label>
                <Input
                  value={seller.name ?? ""}
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
                  value={seller.email ?? ""}
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
                  value={seller.phone ?? ""}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  City
                </label>
                <Input
                  value={seller.city ?? ""}
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
                  value={seller.region ?? ""}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Complete address
                </label>
                <Input
                  value={seller.completeAddress ?? ""}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Product information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Product information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Types of mushroom
                </label>
                <Input
                  value={(seller.typesOfMushroom || []).join(", ")}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Monthly production capacity
                </label>
                <Input
                  value={seller.monthlyProductionCapacity ?? ""}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Certifications
                </label>
                <Input
                  value={(seller.certifications || []).join(", ")}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Banking details */}
          {/* <div>
            <h3 className="text-lg font-medium mb-3">Banking details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Bank name
                </label>
                <Input
                  value={seller.bankName ?? ""}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Account number
                </label>
                <Input
                  value={seller.accountNumber ?? ""}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Account holder name
                </label>
                <Input
                  value={seller.accountHolderName ?? ""}
                  disabled
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>
          </div> */}

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
