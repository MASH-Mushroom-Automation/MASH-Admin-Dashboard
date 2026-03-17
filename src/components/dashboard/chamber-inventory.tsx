"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  useDashboardChambers,
  useDashboardUsersStats,
} from "@/hooks/useDashboardData";
import { useUsers } from "@/hooks/useUsers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { UserItem } from "@/store/userManagementStore";

export default function ChamberInventorySection() {
  const {
    data: usersStats,
    isLoading: dashboardUsersLoading,
    error: dashboardUsersError,
  } = useDashboardUsersStats();
  const {
    data: chambers,
    isLoading: dashboardChambersLoading,
    error: dashboardChambersError,
  } = useDashboardChambers(1, 10);

  const dashboardLoading = {
    usersStats: dashboardUsersLoading,
    chambers: dashboardChambersLoading,
  };
  const dashboardError = {
    usersStats: dashboardUsersError,
    chambers: dashboardChambersError,
  };

  const {
    data: users = [],
    isLoading: userLoading,
    error: userError,
  } = useUsers(1, 100);

  // Combine loading and error states
  const loading = { ...dashboardLoading, users: userLoading };
  const error = { ...dashboardError, users: userError };

  // Show loading state while data is being fetched
  if (loading.usersStats || loading.chambers || loading.users) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">
          Loading chamber and user data...
        </div>
      </div>
    );
  }

  // Use fetched data directly (no more fallback constants)
  const actualUsersStats = usersStats || {};
  const actualChambers = chambers || {
    chambers: [],
    total: 0,
    page: 1,
    limit: 10,
  };
  const actualUsers = users || [];

  console.log("[ChamberInventory] Using real data:", {
    usersStats: actualUsersStats,
    chambersCount: actualChambers.chambers?.length || 0,
    usersCount: actualUsers.length,
    hasErrors: {
      usersStats: !!error.usersStats,
      chambers: !!error.chambers,
      users: !!error.users,
    },
  });

  // Role mapping for display labels (frontend friendly names)
  const getRoleLabel = (backendRole: string): string => {
    if (!backendRole) return "Unknown";
    
    const normalizedRole = backendRole.toLowerCase().trim();
    
    // Handle all variations of user roles
    if (normalizedRole === "user" || normalizedRole === "users" || normalizedRole === "buyer" || normalizedRole === "buyers") {
      return "Buyers";
    }
    if (normalizedRole === "admin") {
      return "Seller";
    }
    if (normalizedRole === "super_admin" || normalizedRole === "super admin" || normalizedRole === "superadmin") {
      return "Admin";
    }
    if (normalizedRole === "grower") {
      return "Grower";
    }
    
    return backendRole;
  };

  const getColorForRole = (backendRole: string): string => {
    if (!backendRole) return "#888888";
    
    const normalizedRole = backendRole.toLowerCase().trim();
    
    if (normalizedRole === "user" || normalizedRole === "users" || normalizedRole === "buyer" || normalizedRole === "buyers") {
      return "#2E5E4E";
    }
    if (normalizedRole === "admin") {
      return "#58B33A";
    }
    if (normalizedRole === "super_admin" || normalizedRole === "super admin" || normalizedRole === "superadmin") {
      return "#FF6B35";
    }
    if (normalizedRole === "grower") {
      return "#C6DABF";
    }
    
    return "#888888";
  };

  // Get role counts from actual users data (not backend stats)
  // Filter to match User Management page: active users only, excluding SUPER_ADMIN
  const filteredUsersForStats = actualUsers.filter(
    (user) =>
      user.role?.toUpperCase() !== "SUPER_ADMIN" && user.isActive === true,
  );

  // Calculate role distribution from actual users
  const userRoleCount: Record<string, number> = {};
  filteredUsersForStats.forEach((user) => {
    const role = user.role || "UNKNOWN";
    userRoleCount[role] = (userRoleCount[role] || 0) + 1;
  });

  console.log("[ChamberInventory] Calculated role counts from actual users:", userRoleCount);

  // Use fetched data for table — show only the 5 most recent entries
  const registryAll = actualChambers?.chambers || [];
  const registry = registryAll.slice(0, 5);

  // Build pie chart data from backend stats - exclude SUPER_ADMIN from display
  const userPieData = Object.entries(userRoleCount)
    .map(([role, count]) => ({
      name: getRoleLabel(role),
      value: count as number,
      color: getColorForRole(role),
      backendRole: role,
    }))
    .filter((item) => {
      if (item.value <= 0) return false;
      const normalized = item.backendRole?.toLowerCase().trim() || "";
      // Exclude super admin and admin roles
      return (
        normalized !== "super_admin" &&
        normalized !== "super admin" &&
        normalized !== "superadmin"
      );
    }); // Only show roles with users, exclude SUPER_ADMIN

  // Debug: log registry to help verify data arrives and is mapped correctly
  if (typeof window !== "undefined") {
    console.log("[ChamberInventory] registry (showing up to 5):", registry);
    console.log("[ChamberInventory] usersStats:", actualUsersStats);
    console.log(
      "[ChamberInventory] users (showing up to 5):",
      actualUsers.slice(0, 5),
    );
    console.log("[ChamberInventory] userRoleCount:", userRoleCount);
    if (error.usersStats || error.chambers || error.users) {
      console.log("[ChamberInventory] Using fallback data due to API error");
    }
  }

  return (
    <div>
      {/* Second Row - Users Distribution Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Users Distribution</CardTitle>
            <CardDescription>User list by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={userPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {userPieData.map((entry, index) => (
                      <Cell key={`cell-user-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-x-7 flex justify-center text-center">
                {userPieData.map((item) => (
                  <div key={item.name} className="text-sm">
                    <span className="font-medium flex justify-center items-center">
                      {item.value}
                    </span>
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List Table */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <CardDescription>
              List of registered users — showing 5 most recent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actualUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  actualUsers.slice(0, 5).map((user: UserItem) => (
                    <TableRow
                      key={user.id}
                      className="border-b border-border hover:bg-secondary/50"
                    >
                      <TableCell className="py-3 px-4 text-foreground">
                        {user.name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-foreground">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-foreground">
                          {getRoleLabel(user.role || "")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
