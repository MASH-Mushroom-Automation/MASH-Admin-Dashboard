"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { SellerTable } from "@/components/ecommerce/seller-table";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PaginationWrapper from "@/components/pagination";
import { Archive } from "lucide-react";
import { useSellerApplicationStore } from "@/store/sellerApplicationStore";

// Local Seller type (matches SellerTable component expectations)
interface Seller {
  id: string;
  name: string;
  storeName: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
  address?: string;
  username?: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
}

export type TabType = "pending" | "rejected";

export default function SellerContent() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  // Use seller application store
  const {
    allApplications,
    fetchAllApplications,
    fetchApplicationById,
    approveApplication,
    rejectApplication,
    loading,
    error,
  } = useSellerApplicationStore();

  // Fetch applications on mount and when tab changes
  useEffect(() => {
    const status = activeTab === "pending" ? "PENDING" : "REJECTED";
    fetchAllApplications({ status }).catch((err) => {
      console.error("Failed to fetch seller applications:", err);
      toast.error("Failed to load seller applications");
    });
  }, [activeTab, fetchAllApplications]);

  // Transform applications to Seller format
  const sellers: Seller[] =
    allApplications?.map((app) => ({
      id: app.requestId,
      name: app.sellerName,
      storeName: app.storeName || "N/A",
      email: app.email,
      status: app.isApproved
        ? "approved"
        : activeTab === "rejected"
        ? "rejected"
        : "pending",
      rejectReason: undefined, // Will be fetched from detail view if needed
      address: app.address,
      username: app.user.username,
      phone: undefined, // Not in current API response
      businessName: app.storeName,
      businessType: undefined, // Not in current API response
    })) || [];

  const isLoading = loading.allApplications;
  const fetchError = error.allApplications;

  // Filter sellers by active tab
  const tabFilteredSellers = sellers.filter((seller) => {
    if (activeTab === "pending") return seller.status === "pending";
    if (activeTab === "rejected") return seller.status === "rejected";
    return true;
  });

  const filteredSellers = tabFilteredSellers.filter(
    (seller) =>
      seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSellers = filteredSellers.slice(startIndex, endIndex);

  const handleView = async (seller: Seller) => {
    try {
      // Fetch detailed application data before navigating
      // seller.id is the requestId from the application
      await fetchApplicationById(seller.id);
      // Navigate to seller detail page with requestId
      // URL shows username for better UX, but requestId is passed via query
      router.push(
        `/mash-market/seller/${seller.username || seller.id}?requestId=${
          seller.id
        }`
      );
    } catch (err) {
      console.error("Failed to fetch seller details:", err);
      toast.error("Failed to load seller details");
    }
  };

  const handleAccept = async (sellerId: string) => {
    try {
      await approveApplication(sellerId);
      toast.success("Seller application approved successfully");
      // Refresh the list
      const status = activeTab === "pending" ? "PENDING" : "REJECTED";
      await fetchAllApplications({ status });
    } catch (err) {
      console.error("Failed to approve seller:", err);
      toast.error("Failed to approve seller application");
    }
  };

  const handleReject = async (sellerId: string, reason?: string) => {
    try {
      await rejectApplication(sellerId, reason);
      toast.error(`Seller application rejected${reason ? ` — ${reason}` : ""}`);
      setActiveTab("rejected");
      // Refresh the list
      await fetchAllApplications({ status: "REJECTED" });
    } catch (err) {
      console.error("Failed to reject seller:", err);
      toast.error("Failed to reject seller application");
    }
  };

  const handleArchive = (id: string) => {
    // TODO: Implement API call to archive seller
    toast.success("Seller archived successfully — opening archive page");
    router.push(`/mash-market/seller/archive?id=${id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full px-4 py-8 overflow-x-hidden">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {/* <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                          <ChevronLeft className="h-4 w-4" />
                          Back
                        </Button> */}
        </div>
        <h1 className="text-3xl font-bold">Seller Management</h1>
        <p className="text-muted-foreground mt-1">
          ADMIN Role Accounts (Sellers)
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              Loading sellers...
            </span>
          </div>
        </Card>
      )}

      {/* Error State */}
      {fetchError && !isLoading && (
        <Card className="p-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error: {fetchError}</p>
            <Button
              onClick={() => {
                const status = activeTab === "pending" ? "PENDING" : "REJECTED";
                fetchAllApplications({ status }).catch(console.error);
              }}
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Main Content */}
      {!isLoading && !fetchError && (
        <>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
            className="mb-6"
          >
            <TabsList className="flex w-full ">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Controls Section */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Archive shortcut (icon-only) placed beside filters */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/mash-market/seller/archive")}
                aria-label="View seller archives"
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <Card className="overflow-hidden">
            <SellerTable
              sellers={paginatedSellers.filter(
                (seller) => seller.status === activeTab
              )}
              activeTab={activeTab}
              searchQuery={searchQuery}
              onView={handleView}
              onAccept={handleAccept}
              onReject={handleReject}
              onArchive={handleArchive}
            />
          </Card>

          {/* Pagination Section */}
          <PaginationWrapper
            totalItems={filteredSellers.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            label="Pending"
          />
        </>
      )}
    </div>
  );
}
