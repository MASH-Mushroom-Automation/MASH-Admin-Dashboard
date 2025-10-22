"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const applicationData = [
  { name: "Approved", value: 12, color: "#10b981" },
  { name: "Pending", value: 3, color: "#f59e0b" },
  { name: "Rejected", value: 2, color: "#ef4444" },
]

const pendingApplications = [
  { name: "John Doe", role: "Grower", location: "Mindanao", date: "2024-10-10", days: 5 },
  { name: "Maria Santos", role: "Seller", location: "Caloocan", date: "2024-10-08", days: 7 },
  { name: "Pedro Reyes", role: "Grower", location: "Negros", date: "2024-10-05", days: 10 },
]

export default function GrowersSection() {
  return (
    <div>
      {/* <h2 className="text-2xl font-bold text-foreground">Growers/Sellers</h2> */}

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Pending Applications */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Applications</CardTitle>
            <CardDescription>Awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">8</p>
                  <p className="text-xs text-muted-foreground">Growers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">2</p>
                  <p className="text-xs text-muted-foreground">Sellers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">3</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Approved Products */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approved Products</CardTitle>
            <CardDescription>Product status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">15</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">3</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
              <Button className="w-full bg-transparent" variant="outline" size="sm">
                Review
              </Button>
            </div>
          </CardContent>
        </Card> */}


      </div>

      {/* Pending Applications Table */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Days Pending</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApplications.map((app) => (
                  <tr key={app.name} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-3 px-4 text-foreground">{app.name}</td>
                    <td className="py-3 px-4 text-foreground">{app.role}</td>
                    <td className="py-3 px-4 text-foreground">{app.location}</td>
                    <td className="py-3 px-4 text-muted-foreground">{app.date}</td>
                    <td className="py-3 px-4">
                      <span className={app.days > 7 ? "text-red-600 font-medium" : "text-foreground"}>
                        {app.days} days
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
