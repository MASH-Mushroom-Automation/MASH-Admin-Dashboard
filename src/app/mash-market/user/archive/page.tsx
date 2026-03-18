"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DataTable } from "@/components/data-table";
import PaginationWrapper from "@/components/pagination";
import { useUserManagementStore } from "@/store/userManagementStore";
import { toast } from "sonner";

export default function UserArchivePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Use Zustand store for users data
  const {
    users: allUsers,
    loading: storeLoading,
    error: storeError,
    fetchUsers,
    archiveUser,
  } = useUserManagementStore();

  // Filter to show only archived users (isActive === false), excluding SUPER_ADMIN
  const archivedUsers = useMemo(() => {
    const filtered = (allUsers || []).filter(
      (user) =>
        user.role?.toUpperCase() !== "SUPER_ADMIN" && user.isActive === false
    );
    console.log(
      "[ArchivePage] Total users from API:",
      (allUsers || []).length,
      "| Archived users (isActive=false):",
      filtered.length
    );
    return filtered;
  }, [allUsers]);

  const loading = storeLoading.users ?? false;
  const error = storeError.users ?? null;

  // Fetch users from API on mount
  useEffect(() => {
    console.log("[ArchivePage] useEffect triggered - calling fetchUsers()");
    fetchUsers();
    setCurrentPage(1);
  }, [fetchUsers]);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = archivedUsers.slice(startIndex, endIndex);

  // Handle bulk unarchive
  const handleUnarchive = async (ids: string[]) => {
    if (ids.length === 0) {
      toast.error("No users selected for unarchiving");
      return;
    }

    try {
      toast.loading(`Unarchiving ${ids.length} user(s)...`, { id: "unarchive-users" });
      await Promise.all(ids.map((id) => archiveUser(id, false)));
      toast.success(`${ids.length} user(s) unarchived successfully`, { id: "unarchive-users" });
      // Refresh the list
      fetchUsers();
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to unarchive users";
      toast.error(errorMessage, { id: "unarchive-users" });
      console.error("[ArchivePage] Unarchive error:", err);
    }
  };

  // Handle export
  const handleExport = (rows: any[]) => {
    const csv = [
      ["Name", "Username", "Email", "Phone", "Role"],
      ...rows.map((r) => [
        r.name || "",
        r.username || "",
        r.email || "",
        r.phone || "",
        r.role || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archived-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link href="/mash-market/user">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold">Archived Users</h1>
            <p className="text-muted-foreground mt-1">Inactive users</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">
                Loading archived users...
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

        {/* Main Content */}
        {!loading && !error && (
          <>
            <Card>
              <DataTable
                data={paginatedUsers}
                initialPageSize={itemsPerPage}
                hidePagination
                mode="users"
                onArchive={handleUnarchive}
                onExport={handleExport}
                archivedView={true}
                simpleActions={true}
                entityName="user"
              />
            </Card>
            <PaginationWrapper
              totalItems={archivedUsers.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              label="users"
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
