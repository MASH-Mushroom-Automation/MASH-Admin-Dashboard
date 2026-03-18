

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
import {
  useSellers,
  useApproveSeller,
  useRejectSeller,
} from "@/hooks/useSellers";
import { useArchiveUser } from "@/hooks/useUsers";
import TableSkeleton from "@/components/ui/table-skeleton";
import CardSkeleton from "@/components/ui/card-skeleton";
import InlineSpinner from "@/components/ui/inline-spinner";

// Local Seller type (matches SellerTable component expectations)
interface Seller {
  id: string;
  requestId: string;
  userId: string;
  name: string;
  storeName: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
  region?: string;
  username?: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
}

export type TabType = "pending" | "approved" | "rejected";

export default function SellerContent() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [contentVisible, setContentVisible] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkArchiveIds, setBulkArchiveIds] = useState<string[] | null>(null);
  const [, setBulkArchiveNames] = useState<string[] | null>(
    null,
  );
  const [bulkRejectIds, setBulkRejectIds] = useState<string[] | null>(null);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    sellerId: string;
    action: "reject" | "Archive" | "accept";
  } | null>(null);
  const router = useRouter();

  // Use unified seller application source so business fields are consistently available.
  const {
    data: allApplications = [],
    isLoading,
    error,
  } = useSellers();
  const { mutateAsync: approveApplication } = useApproveSeller();
  const { mutateAsync: rejectApplication } = useRejectSeller();
  const { mutateAsync: archiveUser } = useArchiveUser();

  // Transform applications to Seller format
  const sellers: Seller[] =
    allApplications.map((app) => {
      const normalizedStatus = String(app.status || "").toUpperCase();
      const businessName = app.storeName || "";

      return {
        id: app.requestId,
        requestId: app.requestId,
        userId: app.userId || app.user?.id || "",
        name: app.sellerName,
        storeName: businessName,
        email: app.email,
        status:
          normalizedStatus === "COMPLETED" ||
            normalizedStatus === "APPROVED" ||
            app.isApproved
            ? "approved"
            : normalizedStatus === "FAILED" || normalizedStatus === "REJECTED"
              ? "rejected"
              : "pending",
        rejectReason: undefined,
        region: app.region || "N/A",
        username: app.user?.username || "",
        phone: undefined,
        businessName,
        businessType: undefined,
      };
    }) || [];

  const fetchError = error ? (error as Error).message : null;

  useEffect(() => {
    if (isLoading) {
      setContentVisible(false);
    } else {
      const t = setTimeout(() => setContentVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Filter sellers by active tab
  const tabFilteredSellers = sellers.filter((seller) => {
    if (activeTab === "pending") return seller.status === "pending";
    if (activeTab === "approved") return seller.status === "approved";
    if (activeTab === "rejected") return seller.status === "rejected";
    return true;
  });

  const filteredSellers = tabFilteredSellers.filter(
    (seller) =>
      seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.region?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSellers = filteredSellers.slice(startIndex, endIndex);

  // Dynamic rows-per-page options

  const handleView = async (seller: Seller) => {
    try {
      // Navigate to seller detail page with requestId
      // URL shows username for better UX, but requestId is passed via query
      router.push(
        `/mash-market/seller/${seller.username || seller.id}?requestId=${seller.id
        }`,
      );
    } catch (err) {
      console.error("Failed to fetch seller details:", err);
      toast.error("Failed to load seller details");
    }
  };

  const handleAccept = async (sellerId: string) => {
    console.log("[SellerPage] Approving seller:", sellerId);

    try {
      await approveApplication({ requestId: sellerId });
      toast.success("Seller application approved successfully");
    } catch (err) {
      console.error("Failed to approve seller:", err);
      toast.error("Failed to approve seller application");
    }
  };

  const handleReject = async (sellerId: string, reason?: string) => {
    try {
      await rejectApplication({ requestId: sellerId, reason });
      toast.error(`Seller application rejected${reason ? ` — ${reason}` : ""}`);
      setActiveTab("rejected");
    } catch (err) {
      console.error("Failed to reject seller:", err);
      toast.error("Failed to reject seller application");
    }
  };

  const handleArchive = async (id: string) => {
    const userId =
      sellers.find((seller) => seller.id === id || seller.requestId === id)
        ?.userId || id;

    if (!userId) {
      toast.error("Unable to archive seller: missing user ID");
      return;
    }

    try {
      toast.loading("Archiving seller...", { id: "archive-seller" });
      await archiveUser({ id: userId, archive: true });
      toast.success("Seller archived successfully", { id: "archive-seller" });
    } catch (err) {
      console.error("Failed to archive seller:", err);
      toast.error("Failed to archive seller", { id: "archive-seller" });
    }
  };

  const handleBulkArchive = async () => {
    const requestIdsToArchive =
      bulkArchiveIds && bulkArchiveIds.length
        ? bulkArchiveIds
        : deletingId
          ? [deletingId]
          : [];
    if (requestIdsToArchive.length === 0) {
      toast.error("No seller selected for archiving");
      setShowArchiveConfirm(false);
      return;
    }

    const userIdsToArchive = Array.from(
      new Set(
        requestIdsToArchive
          .map(
            (requestId) =>
              sellers.find(
                (seller) =>
                  seller.id === requestId || seller.requestId === requestId,
              )?.userId,
          )
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (userIdsToArchive.length === 0) {
      toast.error("Unable to archive selected seller(s): missing user IDs");
      setShowArchiveConfirm(false);
      setDeletingId(null);
      setBulkArchiveIds(null);
      setBulkArchiveNames(null);
      return;
    }

    try {
      toast.loading("Archiving seller(s)...", { id: "archive-seller" });
      // Run all archive requests in parallel via backend API
      const results = await Promise.allSettled(
        userIdsToArchive.map((id) => archiveUser({ id, archive: true })),
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
        header: "Business Name",
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
        accessorKey: "region",
        header: "Region",
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
              className="max-w-40 truncate"
              title={String(getValue() ?? "")}
            >
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(
                  getValue() ?? "",
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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Seller Management</h1>
          {isLoading && <InlineSpinner />}
        </div>
        <p className="text-muted-foreground mt-1">
          Review and manage seller applications
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <CardSkeleton />
          <Card className="p-4">
            <TableSkeleton rows={5} />
          </Card>
        </div>
      )}

      {/* Error State */}
      {fetchError && !isLoading && (
        <Card className="p-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error: {fetchError}</p>
            <Button
              onClick={() => {
                window.location.reload();
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
              <TabsTrigger value="approved">Approved</TabsTrigger>
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
              <div
                className={`transition-all duration-200 ease-in-out ${contentVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
              >
                <DataTable
                  data={paginatedSellers.filter(
                    (seller) => seller.status === activeTab,
                  )}
                  initialPageSize={itemsPerPage}
                  hidePagination
                  columns={columns}
                  mode="sellers"
                  showAcceptReject={activeTab === "pending"}
                  activeTab={activeTab}
                  onArchive={
                    activeTab === "approved"
                      ? undefined
                      : (ids: string[]) => {
                        const idsArr = ids && ids.length ? ids : null;
                        setBulkArchiveIds(idsArr);
                        if (idsArr) {
                          const names = idsArr.map(
                            (id) =>
                              filteredSellers.find((s) => s.id === id)?.name || id,
                          );
                          setBulkArchiveNames(names.length ? names : null);
                        } else {
                          setBulkArchiveNames(null);
                        }
                        setShowArchiveConfirm(true);
                      }
                  }
                  onBulkAccept={async (ids: string[]) => {
                    if (!ids || ids.length === 0) {
                      toast.error("No sellers selected");
                      return;
                    }

                    try {
                      toast.loading(`Approving ${ids.length} seller(s)...`, {
                        id: "bulk-approve",
                      });

                      const results = await Promise.allSettled(
                        ids.map((requestId) =>
                          approveApplication({
                            requestId,
                            adminNotes: "Bulk approval",
                          }),
                        ),
                      );
                      const approved = results.filter(
                        (r) => r.status === "fulfilled",
                      ).length;
                      const failed = results.filter(
                        (r) => r.status === "rejected",
                      ).length;

                      console.log("Bulk approve result:", { approved, failed });

                      // Explicitly dismiss loading toast
                      toast.dismiss("bulk-approve");

                      // Wait a tiny bit for dismiss to process
                      await new Promise((resolve) => setTimeout(resolve, 100));

                      if (approved > 0) {
                        toast.success(
                          `Successfully approved ${approved} seller(s)${failed > 0 ? `, ${failed} failed` : ""
                          }`,
                          { duration: 4000 },
                        );
                      } else if (failed > 0) {
                        toast.error(`Failed to approve ${failed} seller(s)`);
                      }
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
            </div>
          </Card>

          {/* Pagination Section */}
          <PaginationWrapper
            totalItems={filteredSellers.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            label={
              activeTab === "pending"
                ? "Pending"
                : activeTab === "approved"
                  ? "Approved"
                  : "Rejected"
            }
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
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
                    { id: "bulk-reject" },
                  );

                  const results = await Promise.allSettled(
                    bulkRejectIds.map((requestId) =>
                      rejectApplication({
                        requestId,
                        reason: reason || "Bulk rejection",
                      }),
                    ),
                  );

                  const approved = results.filter(
                    (r) => r.status === "fulfilled",
                  ).length;
                  const failed = results.filter(
                    (r) => r.status === "rejected",
                  ).length;

                  console.log("Bulk reject result:", { approved, failed });

                  // Explicitly dismiss loading toast
                  toast.dismiss("bulk-reject");

                  // Wait a tiny bit for dismiss to process
                  await new Promise((resolve) => setTimeout(resolve, 100));

                  if (approved > 0) {
                    toast.success(
                      `Successfully rejected ${approved} seller(s)${failed > 0 ? `, ${failed} failed` : ""
                      }`,
                      { duration: 4000 },
                    );
                  } else if (failed > 0) {
                    toast.error(`Failed to reject ${failed} seller(s)`);
                  }

                  // Switch to rejected tab and refresh
                  setActiveTab("rejected");
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
