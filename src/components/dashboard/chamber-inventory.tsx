// src/components/chamber-inventory.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";

// Fallback data when API fails
const FALLBACK_USER_STATS: Record<string, number> = {
  ADMIN: 12,
  BUYER: 45,
  GROWER: 28,
};

const FALLBACK_USERS = [
  {
    id: "USR-001",
    name: "Manny Jacinto",
    email: "john.doe@example.com",
    phone: "+63 912 345 6789",
    role: "BUYER",
    status: "Active",
    region: "Metro Manila",
  },
  {
    id: "USR-002",
    name: "Hiria Momo",
    email: "jane.smith@example.com",
    phone: "+63 923 456 7890",
    role: "GROWER",
    status: "Active",
    region: "Quezon City",
  },
  {
    id: "USR-003",
    name: "Jeon Jungkook",
    email: "bob.johnson@example.com",
    phone: "+63 934 567 8901",
    role: "BUYER",
    status: "Active",
    region: "Cebu",
  },
  {
    id: "USR-004",
    name: "Hannah Montana",
    email: "alice.williams@example.com",
    phone: "+63 945 678 9012",
    role: "ADMIN",
    status: "Active",
    region: "Davao",
  },
  {
    id: "USR-005",
    name: "Saturo Gojo",
    email: "charlie.brown@example.com",
    phone: "+63 956 789 0123",
    role: "GROWER",
    status: "Inactive",
    region: "Baguio",
  },
];

const FALLBACK_CHAMBERS = {
  chambers: [
    {
      id: "CH-001",
      grower: "Manny Jacinto",
      location: "Manila, Philippines",
      status: "Active",
    },
    {
      id: "CH-002",
      grower: "Hiria Momo",
      location: "Quezon City, Philippines",
      status: "Active",
    },
    {
      id: "CH-003",
      grower: "Jeon Jungkook",
      location: "Cebu, Philippines",
      status: "Inactive",
    },
    {
      id: "CH-004",
      grower: "Hannah Montana",
      location: "Davao, Philippines",
      status: "Active",
    },
    {
      id: "CH-005",
      grower: "Saturo Gojo",
      location: "Baguio, Philippines",
      status: "Active",
    },
  ],
  total: 5,
  page: 1,
  limit: 10,
};

export default function ChamberInventorySection() {
  const { usersStats, chambers, users, loading, error } = useDashboardStore();

  if (loading.usersStats || loading.chambers) {
    return <div>Loading...</div>;
  }

  // Use fallback data if there's an error or no data
  const actualUsersStats =
    error.usersStats || !usersStats ? FALLBACK_USER_STATS : usersStats;
  const actualChambers =
    error.chambers || !chambers ? FALLBACK_CHAMBERS : chambers;
  const actualUsers = error.users || !users ? FALLBACK_USERS : users;

  // Use fetched data for pie chart — show only ADMIN, BUYER, GROWER
  const allowedRoles = ["ADMIN", "BUYER", "GROWER"];

  const roleLabelMap: Record<string, string> = {
    ADMIN: "Seller",
    BUYER: "Buyer",
    GROWER: "Grower",
  };

  const colors: Record<string, string> = {
    ADMIN: "#58B33A",
    BUYER: "#2E5E4E",
    GROWER: "#C6DABF",
  };

  const pieData = allowedRoles.map((key) => ({
    name: roleLabelMap[key] ?? key,
    value: actualUsersStats?.[key] ?? 0,
    color: colors[key] ?? "#888888",
  }));

  // Use fetched data for table — show only the 5 most recent entries
  const registryAll = actualChambers?.chambers || [];
  const registry = registryAll.slice(0, 5);

  // Calculate user role distribution from actualUsers array
  const userRoleCount: Record<string, number> = {};
  actualUsers.forEach((user) => {
    const role = user.role || "UNKNOWN";
    userRoleCount[role] = (userRoleCount[role] || 0) + 1;
  });

  const userPieData = allowedRoles.map((key) => ({
    name: roleLabelMap[key] ?? key,
    value: userRoleCount[key] ?? 0,
    color: colors[key] ?? "#888888",
  }));

  // Debug: log registry to help verify data arrives and is mapped correctly
  if (typeof window !== "undefined") {
    console.log("[ChamberInventory] registry (showing up to 5):", registry);
    console.log("[ChamberInventory] usersStats:", actualUsersStats);
    console.log(
      "[ChamberInventory] users (showing up to 5):",
      actualUsers.slice(0, 5)
    );
    console.log("[ChamberInventory] userRoleCount:", userRoleCount);
    if (error.usersStats || error.chambers || error.users) {
      console.log("[ChamberInventory] Using fallback data due to API error");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
        {/* <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Users</CardTitle>
            <CardDescription>Overview of all user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-x-7 flex justify-center text-center">
                {pieData.map((item) => (
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
        </Card> */}

        {/* Chamber Registry Table */}
        {/* <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Chamber Registry</CardTitle>
            <CardDescription>
              List of registered chambers — showing 5 most recent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Chamber ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Grower Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {registry.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No chambers found.
                    </td>
                  </tr>
                ) : (
                  registry.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border hover:bg-secondary/50"
                    >
                      <td className="py-3 px-4 text-foreground">{row.id}</td>
                      <td className="py-3 px-4 text-foreground">
                        {row.grower}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {row.location}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            row.status === "Active"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card> */}
      </div>

      {/* Second Row - Users Distribution Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Users Distribution</CardTitle>
            <CardDescription>
              User list by role (from users data)
            </CardDescription>
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    User ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {actualUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  actualUsers.slice(0, 5).map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border hover:bg-secondary/50"
                    >
                      <td className="py-3 px-4 text-foreground">{user.id}</td>
                      <td className="py-3 px-4 text-foreground">{user.name}</td>
                      <td className="py-3 px-4 text-foreground">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-secondary">
                          {roleLabelMap[user.role || ""] || user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.status === "Active"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
