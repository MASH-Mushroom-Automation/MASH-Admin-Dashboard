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
import PaginationWrapper from "@/components/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboardStore";

const ITEMS_PER_PAGE = 5;

export default function UsersManagement() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  // Multi-select bulk filters (checkboxes) - Role filter removed since we only show BUYER
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
  >("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Use Zustand store for users data
  const {
    users: allUsers,
    loading: storeLoading,
    error: storeError,
    fetchUsers,
  } = useDashboardStore();

  // All users from /v1/users endpoint are BUYER role by default
  const users = useMemo(() => {
    console.log('[UserPage] Total users (all are BUYER):', (allUsers || []).length);
    return allUsers || [];
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
    console.log("[UserPage] Filtered BUYER users:", users.length);
    console.log("[UserPage] BUYER users:", users);
    console.log("[UserPage] Loading state:", loading);
    console.log("[UserPage] Error state:", error);
  }, [allUsers, users, loading, error]);

  // Filtered users (already filtered to BUYER role only)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = [user.name, user.email, user.username].some(
        (field) => field?.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Pagination logic
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

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

  const handleArchive = () => {
    // In a real app we'd call the archive API here. For now, navigate to the archive page.
    const id = deletingId;
    setShowArchiveConfirm(false);
    setDeletingId(null);
    toast.success("User archived — opening archive page");
    // navigate to the archive page and include the archived id as a query param
    if (id) router.push(`/mash-market/user/archive?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full space-y-4">
        {/* Header */}
        <header>
          <h1 className="sm:text-3xl text-2xl font-bold">Buyer Management</h1>
          <p className="text-muted-foreground mt-1 mb-5 sm:text-base text-sm">
            BUYER Accounts Overview
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
                          <span className="font-medium">Filters</span>
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
                              className="rounded-sm"
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
                              className="rounded-sm"
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
                              className="rounded-sm"
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
                              className="rounded-sm"
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
                              className="rounded-sm"
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

            {/* Users Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="table-fixed">
                  <TableHeader>
                    <tr>
                      {[
                        "Profile",
                        "Name",
                        "Username",
                        "Email",
                        "Phone",
                        "Region",
                        "Role",
                        "Actions",
                      ].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="px-6 py-12 text-center text-muted-foreground"
                        >
                          {/* Debug info when no users */}
                          <div>
                            <p>There is no user yet</p>
                            <p className="text-xs mt-2 text-gray-500">
                              Debug: {allUsers?.length || 0} total users, {users.length} BUYER users, {filteredUsers.length} after filters
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="px-6 py-4">
                            <UserAvatar initials={user.avatar || "U"} />
                          </TableCell>
                          <TableCell>{user.name || "N/A"}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm truncate">
                            {user.username || "N/A"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap truncate">
                            {user.email || "N/A"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap truncate">
                            {user.phone || "N/A"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {user.region || "N/A"}
                          </TableCell>
                          <TableCell>{user.role || "N/A"}</TableCell>
                          <TableCell>
                            <ActionsMenu
                              id={user.id}
                              // navigate to the new detail page for this user
                              viewUrl={`/mash-market/user/${user.id}`}
                              onArchive={() => {
                                setDeletingId(user.id);
                                setShowArchiveConfirm(true);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Pagination */}
            <PaginationWrapper
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              label="users"
            />

            {/* Archive Confirmation */}
            {showArchiveConfirm && (
              <ConfirmationPopover
                action="Archive"
                entity="User"
                onConfirm={handleArchive}
                onCancel={() => {
                  setShowArchiveConfirm(false);
                  setDeletingId(null);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
