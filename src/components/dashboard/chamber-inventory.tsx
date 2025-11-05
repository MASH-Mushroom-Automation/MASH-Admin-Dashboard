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

export default function ChamberInventorySection() {
  return (
    <div>

    <div className="grid grid-cols-1 lg:grid-cols-3 sm:gap-6 gap-y-6">
        {/* Overview Card */}
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
    </div>
  )
}