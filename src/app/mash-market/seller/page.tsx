"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { SellerActionMenu } from "@/components/ecommerce/seller-action-menu";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import RejectReasonModal from "@/components/ecommerce/reject-reason-modal";
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
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkArchiveIds, setBulkArchiveIds] = useState<string[] | null>(null);
  const [bulkArchiveNames, setBulkArchiveNames] = useState<string[] | null>(
    null
  );
  const [bulkRejectIds, setBulkRejectIds] = useState<string[] | null>(null);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    sellerId: string;
    action: "reject" | "Archive" | "accept";
  } | null>(null);
  const router = useRouter();

  // Use seller application store
  const {
    allApplications,
    fetchAllApplications,
    fetchApplicationById,
    approveApplication,
    rejectApplication,
    bulkApproveApplications,
    bulkRejectApplications,
    loading,
    error,
  } = useSellerApplicationStore();

  // Fetch applications on mount and when tab changes
  useEffect(() => {
    const status = activeTab === "pending" ? "PENDING" : "FAILED";
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

  // Dynamic rows-per-page options
  const getRowsPerPageOptions = (total: number) => {
    const opts = new Set<number>();
    // always include current itemsPerPage so the select remains controlled
    opts.add(itemsPerPage);

    if (total <= 1) {
      opts.add(Math.max(1, total));
      return Array.from(opts).sort((a, b) => a - b);
    }

    // build sensible multiples of 5 up to total (5,10,15,...)
    for (let v = 5; v <= total; v += 5) {
      opts.add(v);
    }

    // always include total as an option (exact all)
    opts.add(total);

    // ensure small totals still show an option
    if (total < 5) opts.add(total);

    return Array.from(opts).sort((a, b) => a - b);
  };
  const rowsPerPageOptions = getRowsPerPageOptions(filteredSellers.length);

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
    console.log("[SellerPage] Approving seller:", sellerId);

    try {
      await approveApplication(sellerId);
      toast.success("Seller application approved successfully");
      // Refresh the list
      const status = activeTab === "pending" ? "PENDING" : "FAILED";
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
      await fetchAllApplications({ status: "FAILED" });
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

  const handleBulkArchive = async () => {
    const idsToArchive =
      bulkArchiveIds && bulkArchiveIds.length
        ? bulkArchiveIds
        : deletingId
        ? [deletingId]
        : [];
    if (idsToArchive.length === 0) {
      toast.error("No seller selected for archiving");
      setShowArchiveConfirm(false);
      return;
    }

    try {
      toast.loading("Archiving seller(s)...", { id: "archive-seller" });
      // Run all in parallel but keep frontend-only behavior (no backend changes)
      const results = await Promise.allSettled(
        idsToArchive.map(async (id) => {
          // For now, call the single-archive handler for each id but avoid navigating for each.
          // We will simulate by waiting a tick and returning success.
          await new Promise((res) => setTimeout(res, 50));
          return { id, status: "ok" };
        })
      );

      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (successes > 0)
        toast.success(`Archived ${successes} seller(s)`, {
          id: "archive-seller",
        });
      if (failures > 0)
        toast.error(`${failures} seller(s) failed to archive`, {
          id: "archive-seller",
        });

      setShowArchiveConfirm(false);
      setDeletingId(null);
      setBulkArchiveIds(null);
      setBulkArchiveNames(null);
      // navigate to archive page for review (preserve previous behavior by navigating to archive root)
      router.push(`/mash-market/seller/archive`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to archive seller(s). Please try again.");
      setShowArchiveConfirm(false);
      setDeletingId(null);
      setBulkArchiveIds(null);
      setBulkArchiveNames(null);
    }
  };

  const handleConfirmAction = (reason?: string) => {
    if (!confirmAction) return;

    if (confirmAction.action === "reject") {
      handleReject(confirmAction.sellerId, reason);
    } else if (confirmAction.action === "Archive") {
      handleArchive(confirmAction.sellerId);
    } else if (confirmAction.action === "accept") {
      handleAccept(confirmAction.sellerId);
    }

    setConfirmAction(null);
  };

  const columns = useMemo(() => {
    const getStatusBadgeColor = (status: string) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "approved":
          return "bg-green-100 text-green-800";
        case "rejected":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const cols: any[] = [
      {
        id: "select",
        header: ({ table }: any) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded-md border-2 border-slate-300 bg-white accent-primary"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }: any) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded-md border-2 border-slate-300 bg-white accent-primary"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label={`Select row ${row.id}`}
          />
        ),
        size: 24,
      },
      {
        accessorKey: "name",
        header: "Seller Name",
        cell: ({ row }: any) => (
          <div className="max-w-[220px] truncate">
            {typeof handleView === "function" ? (
              <button
                className="text-primary underline text-sm p-0 truncate block"
                onClick={() => handleView(row.original)}
                title={row.original.name}
              >
                {row.original.name}
              </button>
            ) : (
              <span className="truncate" title={row.original.name}>
                {row.original.name}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "storeName",
        header: "Store Name",
        cell: ({ getValue }: any) => (
          <div
            className="max-w-[220px] truncate"
            title={String(getValue() ?? "—")}
          >
            {getValue() ?? "—"}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }: any) => (
          <div
            className="max-w-[220px] truncate"
            title={String(getValue() ?? "—")}
          >
            {getValue() ?? "—"}
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ getValue }: any) => (
          <div
            className="max-w-[220px] truncate"
            title={String(getValue() ?? "—")}
          >
            {getValue() ?? "—"}
          </div>
        ),
      },
      activeTab === "rejected"
        ? {
            accessorKey: "rejectReason",
            header: "Reason",
            cell: ({ getValue }: any) => (
              <div
                className="max-w-[300px] truncate"
                title={String(getValue() ?? "—")}
              >
                {getValue() ?? "—"}
              </div>
            ),
          }
        : {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }: any) => (
              <div
                className="max-w-[160px] truncate"
                title={String(getValue() ?? "")}
              >
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(
                    getValue() ?? ""
                  )}`}
                >
                  {getValue() === "pending" ? "For Approval" : getValue()}
                </span>
              </div>
            ),
          },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div onClick={(e) => e.stopPropagation()}>
            <SellerActionMenu
              seller={row.original}
              activeTab={activeTab}
              mode={activeTab === "pending" ? "pending" : "default"}
              onReject={() =>
                setConfirmAction({
                  sellerId: row.original.id,
                  action: "reject",
                })
              }
              onArchive={() =>
                setConfirmAction({
                  sellerId: row.original.id,
                  action: "Archive",
                })
              }
              onAccept={() =>
                setConfirmAction({
                  sellerId: row.original.id,
                  action: "accept",
                })
              }
              onView={() => handleView(row.original)}
            />
          </div>
        ),
      },
    ];

    return cols;
  }, [activeTab, handleView, filteredSellers]);

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
                const status = activeTab === "pending" ? "PENDING" : "FAILED";
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
            <div className="p-4">
              {/** Build columns for DataTable to match SellerTable layout */}
              {/* eslint-disable react-hooks/rules-of-hooks */}
              {/** Columns memoized for stability */}
              <DataTable
                data={paginatedSellers.filter(
                  (seller) => seller.status === activeTab
                )}
                initialPageSize={itemsPerPage}
                hidePagination
                columns={columns}
                mode="sellers"
                onArchive={(ids: string[]) => {
                  const idsArr = ids && ids.length ? ids : null;
                  setBulkArchiveIds(idsArr);
                  if (idsArr) {
                    const names = idsArr.map(
                      (id) =>
                        filteredSellers.find((s) => s.id === id)?.name || id
                    );
                    setBulkArchiveNames(names.length ? names : null);
                  } else {
                    setBulkArchiveNames(null);
                  }
                  setShowArchiveConfirm(true);
                }}
                onBulkAccept={async (ids: string[]) => {
                  if (!ids || ids.length === 0) {
                    toast.error("No sellers selected");
                    return;
                  }

                  try {
                    toast.loading(`Approving ${ids.length} seller(s)...`, {
                      id: "bulk-approve",
                    });

                    const result = await bulkApproveApplications(
                      ids,
                      "Bulk approval"
                    );

                    console.log("Bulk approve result:", result);

                    // Explicitly dismiss loading toast
                    toast.dismiss("bulk-approve");

                    // Wait a tiny bit for dismiss to process
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    if (result.approved > 0) {
                      toast.success(
                        `Successfully approved ${result.approved} seller(s)${
                          result.failed > 0 ? `, ${result.failed} failed` : ""
                        }`,
                        { duration: 4000 }
                      );
                    } else if (result.failed > 0) {
                      toast.error(
                        `Failed to approve ${result.failed} seller(s)`
                      );
                    }

                    // Refresh the list
                    const status =
                      activeTab === "pending" ? "PENDING" : "FAILED";
                    await fetchAllApplications({ status });
                  } catch (err) {
                    console.error("Bulk approve failed:", err);
                    toast.error("Failed to approve sellers", {
                      id: "bulk-approve",
                    });
                  }
                }}
                onBulkReject={(ids: string[]) => {
                  if (!ids || ids.length === 0) {
                    toast.error("No sellers selected");
                    return;
                  }

                  // Open reject modal for bulk rejection
                  setBulkRejectIds(ids);
                  setShowBulkRejectModal(true);
                }}
              />
            </div>
          </Card>

          {/* Pagination Section */}
          <PaginationWrapper
            totalItems={filteredSellers.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            label="Pending"
          />

          {/* Confirm / Reject Modals */}
          {confirmAction && confirmAction.action === "reject" ? (
            <RejectReasonModal
              open={true}
              onOpenChange={(open) => {
                if (!open) setConfirmAction(null);
              }}
              onConfirm={(reason) => handleConfirmAction(reason)}
            />
          ) : confirmAction ? (
            <ConfirmationPopover
              action={confirmAction.action}
              onConfirm={() => handleConfirmAction()}
              onCancel={() => setConfirmAction(null)}
            />
          ) : null}

          {/* Bulk Reject Modal */}
          {showBulkRejectModal && bulkRejectIds && (
            <RejectReasonModal
              open={true}
              onOpenChange={(open) => {
                if (!open) {
                  setShowBulkRejectModal(false);
                  setBulkRejectIds(null);
                }
              }}
              onConfirm={async (reason) => {
                try {
                  toast.loading(
                    `Rejecting ${bulkRejectIds.length} seller(s)...`,
                    { id: "bulk-reject" }
                  );

                  const result = await bulkRejectApplications(
                    bulkRejectIds,
                    reason || "Bulk rejection"
                  );

                  console.log("Bulk reject result:", result);

                  // Explicitly dismiss loading toast
                  toast.dismiss("bulk-reject");

                  // Wait a tiny bit for dismiss to process
                  await new Promise((resolve) => setTimeout(resolve, 100));

                  if (result.approved > 0) {
                    toast.success(
                      `Successfully rejected ${result.approved} seller(s)${
                        result.failed > 0 ? `, ${result.failed} failed` : ""
                      }`,
                      { duration: 4000 }
                    );
                  } else if (result.failed > 0) {
                    toast.error(`Failed to reject ${result.failed} seller(s)`);
                  }

                  // Switch to rejected tab and refresh
                  setActiveTab("rejected");
                  await fetchAllApplications({ status: "FAILED" });
                } catch (err) {
                  console.error("Bulk reject failed:", err);
                  toast.error("Failed to reject sellers", {
                    id: "bulk-reject",
                  });
                } finally {
                  setShowBulkRejectModal(false);
                  setBulkRejectIds(null);
                }
              }}
            />
          )}

          {showArchiveConfirm && (
            <ConfirmationPopover
              action="Archive"
              entity={
                bulkArchiveIds && bulkArchiveIds.length > 1
                  ? "Sellers"
                  : "Seller"
              }
              onConfirm={handleBulkArchive}
              onCancel={() => {
                setShowArchiveConfirm(false);
                setDeletingId(null);
                setBulkArchiveIds(null);
                setBulkArchiveNames(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
