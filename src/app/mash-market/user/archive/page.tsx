"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useUserManagementStore } from "@/store/userManagementStore";
import UserAvatar from "@/components/ecommerce/user-avatar";

export default function UserArchivePage() {
  // Use Zustand store for users data
  const {
    users: allUsers,
    loading: storeLoading,
    error: storeError,
    fetchUsers,
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
  }, [fetchUsers]);
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-end mb-2">
            <div className="shrink-0">
              <Link href="/mash-market/user">
                <Button variant="ghost">Back</Button>
              </Link>
            </div>
          </div>

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
          <Card>
            <div className="overflow-x-auto p-4">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Profile</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {archivedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        No archived users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    archivedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="px-6 py-4">
                          <UserAvatar initials={u.avatar || "U"} />
                        </TableCell>
                        <TableCell>{u.name || "N/A"}</TableCell>
                        <TableCell>{u.username || "N/A"}</TableCell>
                        <TableCell>{u.email || "N/A"}</TableCell>
                        <TableCell>{u.phone || "N/A"}</TableCell>
                        <TableCell>
                          {u.role?.toUpperCase() === "USER"
                            ? "Buyer"
                            : u.role?.toUpperCase() === "ADMIN"
                            ? "Seller"
                            : u.role || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
