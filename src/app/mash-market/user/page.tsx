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
import TableSkeleton from "@/components/ui/table-skeleton";
import CardSkeleton from "@/components/ui/card-skeleton";
import InlineSpinner from "@/components/ui/inline-spinner";
import { Skeleton } from "@/components/ui/skeleton";

// Controlled items per page (rows per page selector)
const DEFAULT_ITEMS_PER_PAGE = 5;
// Fixed rows-per-page options per requirement
const FIXED_ROWS_OPTIONS = [5, 10, 25, 50, 100];

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

  // Control content visibility to allow a smooth transition from skeleton -> content
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setContentVisible(false);
    } else {
      // small delay to allow skeleton fade-out then show content
      const t = setTimeout(() => setContentVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading]);

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

      const matchesRegion =
        selectedRegions.length > 0
          ? selectedRegions.includes(user.region || "")
          : true;

      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [users, searchQuery, statusFilter, selectedStatuses, selectedRegions]);

  const rowsPerPageOptions = FIXED_ROWS_OPTIONS;

  useEffect(() => {
    const total = filteredUsers.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / itemsPerPage);
    // if there are no items, reset to page 1 for consistent UI
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    // keep current page as-is when within bounds
  }, [filteredUsers.length, itemsPerPage]);

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

  // dynamic filter sections (data-driven)
  const FILTER_SECTIONS = [
    {
      key: "statuses",
      label: "Status",
      options: ["Active", "Inactive"],
    },
    {
      key: "regions",
      label: "Region",
      options: ["Caloocan", "Manila", "Quezon City", "Makati", "Pasig"],
    },
  ];

  const activeFiltersCount = selectedStatuses.length + selectedRegions.length;

  // helper to toggle selection generically
  const toggleFilter = (sectionKey: string, value: string) => {
    setCurrentPage(1);
    if (sectionKey === "statuses") {
      setSelectedStatuses((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
    } else if (sectionKey === "regions") {
      setSelectedRegions((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]));
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full space-y-4">
        {/* Header */}
        <header>
          <div className="flex items-center gap-3">
            <h1 className="sm:text-3xl text-2xl font-bold">User Management</h1>
            {loading && <InlineSpinner />}
          </div>
          <p className="text-muted-foreground mt-1 mb-5 sm:text-base text-sm">
            Buyers & Sellers Overview
          </p>
        </header>

        {/* Page-level loading skeleton (header + table) */}
        {loading && (
          <div className="space-y-4">
            <div>
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72 mt-2" />
            </div>

            <div>
              <CardSkeleton />
            </div>

            <div>
              <TableSkeleton rows={itemsPerPage} />
            </div>
          </div>
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
                <div className="flex items-center gap-1">
                  <div className="flex-1 sm:-mb-6 -mb-9">
                    <SearchFilterBar
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      placeholder="Search by name, email, or username..."
                    />
                  </div>

                  {/* Bulk filters as a dropdown - dynamic config-driven */}
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center py-4.5"
                          aria-label={`Filter${activeFiltersCount ? ` (${activeFiltersCount})` : ""}`}
                        >
                          <Filter className="h-4 w-4" />
                          <span className="font-medium">{activeFiltersCount ? `Filters (${activeFiltersCount})` : "Filter"}</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent className="w-64 p-2">
                        {FILTER_SECTIONS.map((section) => (
                          <div key={section.key} className="mb-2">
                            <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
                            <div className="px-1">
                              {section.options.map((opt) => {
                                const checked =
                                  section.key === "statuses"
                                    ? selectedStatuses.includes(opt)
                                    : selectedRegions.includes(opt);
                                return (
                                  <label
                                    key={opt}
                                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      className="rounded-sm transition-colors duration-150 ease-in-out focus:ring-2 focus:ring-primary/30"
                                      checked={checked}
                                      onChange={() => toggleFilter(section.key, opt)}
                                    />
                                    <span className="text-sm">{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <DropdownMenuSeparator />
                          </div>
                        ))}

                        <div className="px-1">
                          <DropdownMenuItem
                            onSelect={() => {
                              // select all for all sections
                              setSelectedStatuses(FILTER_SECTIONS.find(s => s.key === "statuses")?.options ?? []);
                              setSelectedRegions(FILTER_SECTIONS.find(s => s.key === "regions")?.options ?? []);
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
                {!loading ? (
                  <div className={`transition-all duration-200 ease-in-out ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
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
                ) : (
                  <div>
                    <TableSkeleton rows={itemsPerPage} />
                  </div>
                )}
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <PaginationWrapper
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                label="users"
                // pass fixed options
                rowsPerPageOptions={rowsPerPageOptions}
                onItemsPerPageChange={(n) => {
                  setItemsPerPage(n);
                  setCurrentPage(1);
                }}
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
