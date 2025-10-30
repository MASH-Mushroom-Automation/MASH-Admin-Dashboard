"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const chamberData = [
  { name: "Grower", value: 70, color: "#58B33A" },
  { name: "Seller", value: 50, color: "#2E5E4E" },
  { name: "Buyer", value: 48, color: "#C6DABF" },

]

const registryData = [
  { id: "CH-001", grower: "Juan Dela Cruz", location: "Mindanao", status: "Active" },
  { id: "CH-002", grower: "Maria Santos", location: "Caloocan", status: "Active" },
  { id: "CH-003", grower: "Pedro Reyes", location: "Negros", status: "Inactive" },
  { id: "CH-004", grower: "Ana Garcia", location: "Mindanao", status: "Active" },
]

export default function ChamberInventorySection() {
  return (
    <div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
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
                    data={chamberData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chamberData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-x-7 flex justify-center text-center">
                {chamberData.map((item) => (
                  <div key={item.name} className="text-sm">
                    <span className="font-medium flex justify-center items-center">{item.value}</span>
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
          <CardDescription>List of registered chambers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Chamber ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Grower Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>

                  {/* <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th> */}
                </tr>
              </thead>
              <tbody>
                {registryData.map((row) => (
                  <tr key={row.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-3 px-4 text-foreground">{row.id}</td>
                    <td className="py-3 px-4 text-foreground">{row.grower}</td>
                    <td className="py-3 px-4 text-foreground">{row.location}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === "Active" ? "text-green-700" : " text-red-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
  
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
       </div>
    </div>
  )
}
