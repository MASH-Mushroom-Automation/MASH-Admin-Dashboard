<<<<<<< HEAD:src/components/dashboard/sections/chamber-inventory.tsx
// src/components/chamber-inventory.tsx
"use client";
=======
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"


const chamberData = [
  { name: "Grower", value: 70, color: "#58B33A" },
  { name: "Seller", value: 50, color: "#2E5E4E" },
  { name: "Buyer", value: 48, color: "#C6DABF" },

]

const registryData = [
  { id: "CH-001", grower: "Juan Dela Cruz", location: "Mindanao", status: "Active" },
  { id: "CH-002", grower: "Maria Santos", location: "Caloocan", status: "Active" },
  { id: "CH-003", grower: "Pedro Reyes", location: "Negros", status: "Active" },
  { id: "CH-004", grower: "Ana Garcia", location: "Mindanao", status: "Active" },
]
>>>>>>> FE-mashmarket:src/components/dashboard/chamber-inventory.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
export default function ChamberInventorySection() {
  const { usersStats, chambers, loading, error } = useDashboardStore();

  if (loading.usersStats || loading.chambers) {
    return <div>Loading...</div>;
  }

  if (error.usersStats || error.chambers) {
    return <div>Error loading data</div>;
  }

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
    value: usersStats?.[key] ?? 0,
    color: colors[key] ?? "#888888",
  }));

  // Use fetched data for table — show only the 5 most recent entries
  const registryAll = chambers?.chambers || [];
  const registry = registryAll.slice(0, 5);

  // Debug: log registry to help verify data arrives and is mapped correctly
  if (typeof window !== "undefined") {
    console.log("[ChamberInventory] registry (showing up to 5):", registry);
    console.log("[ChamberInventory] usersStats:", usersStats);
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
<<<<<<< HEAD:src/components/dashboard/sections/chamber-inventory.tsx
        <Card className="col-span-1">
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
        </Card>

        {/* Chamber Registry Table */}
        <Card className="col-span-2">
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
        </Card>
      </div>
=======
        <Card>
  <CardHeader>
    <CardTitle>Users</CardTitle>
    <CardDescription>
      Overview of all user roles
    </CardDescription>
  </CardHeader>
  <CardContent className="flex flex-col items-center justify-center space-y-3">
    <div className="w-32 h-32 sm:w-40 sm:h-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chamberData}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
          >
            {chamberData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>

      <div className="sm:space-x-7 space-x-4 flex justify-center text-center">
        {chamberData.map((item) => (
        <div key={item.name} className="text-xs sm:text-sm">
          <span className="font-semibold block">{item.value}</span>
          <span className="text-muted-foreground">{item.name}</span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>

      {/* Chamber Registry Table */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Recent Growers</CardTitle>
          <CardDescription>Newly Registered Mushroom Growers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Grower Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {registryData.map((row) => (
                  <TableRow key={row.id} className="border-b border-border hover:bg-secondary/50">
                    <TableCell className="whitespace-nowrap">{row.id}</TableCell>
                    <TableCell className="min-w-0 truncate">{row.grower}</TableCell>
                    <TableCell className="min-w-0 truncate">{row.location}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === "Active" ? "text-green-700" : " text-red-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
  
                  </TableRow>
                ))}
          </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
       </div>
>>>>>>> FE-mashmarket:src/components/dashboard/chamber-inventory.tsx
    </div>
  );
}
