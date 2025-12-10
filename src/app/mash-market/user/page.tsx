"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/ecommerce/user-avatar";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import { ActionsMenu } from "@/components/user-actions-menu";
import { SearchFilterBar } from "@/components/search-filter-bar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
// DataTable replaces the legacy table and pagination components
import { Button } from "@/components/ui/button";
import PaginationWrapper from "@/components/pagination";
import { Archive, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserManagementStore } from "@/store/userManagementStore";
import { DataTable } from "@/components/data-table";

// Controlled items per page (rows per page selector)
const DEFAULT_ITEMS_PER_PAGE = 5;

export default function UsersManagement() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  // Multi-select bulk filters (checkboxes) - Role filter removed since we only show USER role
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
  >("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(DEFAULT_ITEMS_PER_PAGE);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkArchiveIds, setBulkArchiveIds] = useState<string[] | null>(null);
  const [bulkArchiveNames, setBulkArchiveNames] = useState<string[] | null>(null);

  // Use Zustand store for users data
  const {
    users: allUsers,
    loading: storeLoading,
    error: storeError,
    fetchUsers,
    archiveUser,
  } = useUserManagementStore();

  // Show only active users (isActive === true), excluding SUPER_ADMIN
  const users = useMemo(() => {
    const total = (allUsers || []).length;
    const filtered = (allUsers || []).filter(
      (user) =>
        user.role?.toUpperCase() !== "SUPER_ADMIN" && user.isActive === true
    );
    console.log(
      "[UserPage] Total users from API:",
      total,
      "| Filtered (active users, excluding SUPER_ADMIN):",
      filtered.length
    );
    return filtered;
  }, [allUsers]);

  const loading = storeLoading.users ?? false;
  const error = storeError.users ?? null;

  // Fetch users from API on mount
  useEffect(() => {
    console.log("[UserPage] useEffect triggered - calling fetchUsers()");
    fetchUsers();
  }, [fetchUsers]);

  // Debug logging - runs only on client after hydration
  useEffect(() => {
    console.log("[UserPage] All users from store:", allUsers?.length || 0);
    console.log("[UserPage] All users data:", allUsers);
    console.log(
      "[UserPage] Displaying all roles (ADMIN + USER):",
      users.length
    );
    console.log("[UserPage] Users:", users);
    console.log("[UserPage] Loading state:", loading);
    console.log("[UserPage] Error state:", error);
  }, [allUsers, users, loading, error]);

  // Filtered users (showing all roles: ADMIN and USER)
  const filteredUsers = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        q === "" || [user.name, user.email, user.username].some((field) =>
          String(field ?? "").toLowerCase().includes(q)
        );

      // Status filter: If no status filters selected, show all users (including those without status)
      let matchesStatus = true;
      if (selectedStatuses.length > 0) {
        // Only filter if user has a status and it matches one of the selected statuses
        matchesStatus = user.status
          ? selectedStatuses.includes(user.status)
          : false;
      } else if (statusFilter !== "All") {
        // Single status filter selected from dropdown
        matchesStatus = user.status === statusFilter;
      }
      // If statusFilter === "All" and no selectedStatuses, matchesStatus stays true (show all)

      const matchesRegion =
        selectedRegions.length > 0
          ? selectedRegions.includes(user.region || "")
          : true;

      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [users, searchQuery, statusFilter, selectedStatuses, selectedRegions]);

  // Dynamic rows-per-page options based on amount of filtered data
  const rowsPerPageOptions = useMemo(() => {
    const total = filteredUsers.length;

    // Helper: build multiples of 5 up to total (5,10,15,...), then include total itself
    const opts = new Set<number>();
    // always include current itemsPerPage so the select remains controlled
    opts.add(itemsPerPage);

    if (total <= 1) {
      opts.add(Math.max(1, total));
      return Array.from(opts).sort((a, b) => a - b);
    }

    // Use multiples of 5 as sensible page sizes based on DB size
    for (let v = 5; v <= total; v += 5) {
      opts.add(v);
    }

    // Also include the total number (so exact-all option exists)
    opts.add(total);

    // If total is less than 5, we still want a small, sensible option
    if (total < 5) opts.add(total);

    return Array.from(opts).sort((a, b) => a - b);
  }, [filteredUsers.length, itemsPerPage]);

  // Reset page to 1 whenever search or filters change to avoid jumping pages
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatuses, selectedRegions, statusFilter]);

  // Pagination logic (controlled by local itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Debug logging for filtered/paginated results
  useEffect(() => {
    console.log("[UserPage] After all filters:", filteredUsers.length, "users");
    console.log(
      "[UserPage] Paginated users for display:",
      paginatedUsers.length
    );
    console.log(
      "[UserPage] Current page:",
      currentPage,
      "Start index:",
      startIndex
    );
  }, [filteredUsers, paginatedUsers, currentPage, startIndex]);

  const handleArchive = async () => {
    // Support bulk archive (bulkArchiveIds) or single id (deletingId)
    const idsToArchive = bulkArchiveIds && bulkArchiveIds.length > 0 ? bulkArchiveIds : deletingId ? [deletingId] : [];
    if (idsToArchive.length === 0) {
      toast.error("No user selected for archiving");
      setShowArchiveConfirm(false);
      return;
    }

    try {
      toast.loading("Archiving user(s)...", { id: "archive-user" });

      // Run archive requests in parallel and handle results
      const results = await Promise.allSettled(idsToArchive.map((id) => archiveUser(id)));
      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (successes > 0) {
        toast.success(`Archived ${successes} user(s)`, { id: "archive-user" });
      }
      if (failures > 0) {
        toast.error(`${failures} user(s) failed to archive`, { id: "archive-user" });
      }

      setShowArchiveConfirm(false);
      setDeletingId(null);
      setBulkArchiveIds(null);
      setBulkArchiveNames(null);
      // refresh
      fetchUsers();
    } catch (error) {
      console.error("Failed to archive user(s):", error);
      toast.error("Failed to archive user(s). Please try again.", {
        id: "archive-user",
      });
      setShowArchiveConfirm(false);
      setDeletingId(null);
      setBulkArchiveIds(null);
      setBulkArchiveNames(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full space-y-4">
        {/* Header */}
        <header>
          <h1 className="sm:text-3xl text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1 mb-5 sm:text-base text-sm">
            Buyers & Sellers Overview
          </p>
        </header>

        {/* Loading State */}
        {loading && (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">
                Loading users...
              </span>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="p-8">
            <div className="text-center">
              <p className="text-destructive mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </Card>
        )}

        {/* Main Content - Only show when not loading and no error */}
        {!loading && !error && (
          <>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center py-4.5"
                        >
                          <Filter className="h-4 w-4" />
                          <span className="font-medium">Filter</span>
                          {selectedStatuses.length + selectedRegions.length >
                            0 && (
                            <span className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">
                              {selectedStatuses.length + selectedRegions.length}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent className="w-64 p-2">
                        <DropdownMenuLabel>Area / Status</DropdownMenuLabel>
                        <div className="px-1">
                          <div className="text-xs mb-1 text-muted-foreground">
                            Status
                          </div>
                          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                            <input
                              type="checkbox"
                              className="rounded-sm transition-colors duration-150 ease-in-out focus:ring-2 focus:ring-primary/30"
                              checked={selectedStatuses.includes("Active")}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setCurrentPage(1);
                                setSelectedStatuses((prev) =>
                                  val
                                    ? Array.from(new Set([...prev, "Active"]))
                                    : prev.filter((s) => s !== "Active")
                                );
                              }}
                            />
                            <span className="text-sm">Active</span>
                          </label>
                          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                            <input
                              type="checkbox"
                              className="rounded-sm transition-colors duration-150 ease-in-out focus:ring-2 focus:ring-primary/30"
                              checked={selectedStatuses.includes("Inactive")}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setCurrentPage(1);
                                setSelectedStatuses((prev) =>
                                  val
                                    ? Array.from(new Set([...prev, "Inactive"]))
                                    : prev.filter((s) => s !== "Inactive")
                                );
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
                              className="rounded-sm transition-colors duration-150 ease-in-out focus:ring-2 focus:ring-primary/30"
                              checked={selectedRegions.includes("Caloocan")}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setCurrentPage(1);
                                setSelectedRegions((prev) =>
                                  val
                                    ? Array.from(new Set([...prev, "Caloocan"]))
                                    : prev.filter((r) => r !== "Caloocan")
                                );
                              }}
                            />
                            <span className="text-sm">Caloocan</span>
                          </label>
                          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                            <input
                              type="checkbox"
                              className="rounded-sm transition-colors duration-150 ease-in-out focus:ring-2 focus:ring-primary/30"
                              checked={selectedRegions.includes("Manila")}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setCurrentPage(1);
                                setSelectedRegions((prev) =>
                                  val
                                    ? Array.from(new Set([...prev, "Manila"]))
                                    : prev.filter((r) => r !== "Manila")
                                );
                              }}
                            />
                            <span className="text-sm">Manila</span>
                          </label>
                          <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                            <input
                              type="checkbox"
                              className="rounded-sm transition-colors duration-150 ease-in-out focus:ring-2 focus:ring-primary/30"
                              checked={selectedRegions.includes("Quezon City")}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setCurrentPage(1);
                                setSelectedRegions((prev) =>
                                  val
                                    ? Array.from(
                                        new Set([...prev, "Quezon City"])
                                      )
                                    : prev.filter((r) => r !== "Quezon City")
                                );
                              }}
                            />
                            <span className="text-sm">Quezon City</span>
                          </label>
                        </div>

                        <DropdownMenuSeparator />

                        <div className="px-1">
                          <DropdownMenuItem
                            onSelect={() => {
                              // select all
                              setSelectedStatuses(["Active", "Inactive"]);
                              setSelectedRegions([
                                "Caloocan",
                                "Manila",
                                "Quezon City",
                                "Makati",
                                "Pasig",
                              ]);
                              setCurrentPage(1);
                            }}
                          >
                            Select all
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              // clear
                              setSelectedStatuses([]);
                              setSelectedRegions([]);
                              setStatusFilter("All");
                              setCurrentPage(1);
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/mash-market/user/archive")}
                  aria-label="View archives"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Users Table (TanStack DataTable) - we pass paginated users and hide internal pagination */}
            <Card className="overflow-hidden">
              <div className="p-4">
                <DataTable
                  data={paginatedUsers}
                  initialPageSize={itemsPerPage}
                  hidePagination
                  mode="users"
                  onArchive={(ids) => {
                    // open confirmation for bulk archive
                    const idsArr = ids && ids.length ? ids : null;
                    setBulkArchiveIds(idsArr);
                    if (idsArr) {
                      const names = idsArr.map((id) => filteredUsers.find((u) => u.id === id)?.name || id);
                      setBulkArchiveNames(names.length ? names : null);
                    } else {
                      setBulkArchiveNames(null);
                    }
                    setShowArchiveConfirm(true);
                  }}
                  onBulkChangeRole={(ids, newRole) => {
                    // TODO: Implement bulk role change
                    console.log('Bulk change role:', ids, newRole);
                    toast.success(`Changed role to ${newRole} for ${ids.length} user(s) (API integration pending)`);
                  }}
                  onBulkChangeStatus={(ids, newStatus) => {
                    // TODO: Implement bulk status change
                    console.log('Bulk change status:', ids, newStatus);
                    toast.success(`Changed status to ${newStatus} for ${ids.length} user(s) (API integration pending)`);
                  }}
                />
              </div>
            </Card>

            {/* Rows per page selector + existing pagination */}
            <div className="flex items-center justify-between">
              <div>
                {filteredUsers.length > DEFAULT_ITEMS_PER_PAGE && (
                  <div className="flex items-center">
                    <label className="text-sm text-muted-foreground mr-2">Rows per page:</label>
                    <select
                      className="rounded-md border px-2 py-1 text-sm transition-shadow duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      {rowsPerPageOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <PaginationWrapper
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                label="users"
              />
            </div>

            {/* Archive Confirmation */}
            {showArchiveConfirm && (
              <ConfirmationPopover
                action="Archive"
                entity={
                  bulkArchiveNames && bulkArchiveNames.length > 1
                    ? `${bulkArchiveNames.length} Users (${bulkArchiveNames.join(", ")})`
                    : bulkArchiveNames && bulkArchiveNames.length === 1
                    ? `User (${bulkArchiveNames[0]})`
                    : "User"
                }
                onConfirm={handleArchive}
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
    </div>
  );
}
