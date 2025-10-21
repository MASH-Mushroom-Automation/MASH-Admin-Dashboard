"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Filter } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const chamberData = [
  { name: "Active", value: 45, color: "#10b981" },
  { name: "Offline", value: 2, color: "#ef4444" },
]

const registryData = [
  { id: "CH-001", grower: "Juan Dela Cruz", location: "Mindanao", date: "2024-10-15", status: "Active" },
  { id: "CH-002", grower: "Maria Santos", location: "Caloocan", date: "2024-10-14", status: "Active" },
  { id: "CH-003", grower: "Pedro Reyes", location: "Negros", date: "2024-10-13", status: "Offline" },
  { id: "CH-004", grower: "Ana Garcia", location: "Mindanao", date: "2024-10-12", status: "Active" },
]

export default function ChamberInventorySection() {
  return (
    <div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Chamber Inventory Overview</CardTitle>
            <CardDescription>Status distribution</CardDescription>
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
              <div className="space-y-2">
                {chamberData.map((item) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              {/* <Button className="w-full bg-transparent" variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button> */}
            </div>
          </CardContent>
        </Card>       

      {/* Chamber Registry Table */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Chamber Registry</CardTitle>
          <CardDescription>List of registered chambers</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Chamber ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Grower Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
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
                    {/* <td className="py-3 px-4 text-muted-foreground">{row.date}</td> */}
                    {/* <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td> */}
  
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
