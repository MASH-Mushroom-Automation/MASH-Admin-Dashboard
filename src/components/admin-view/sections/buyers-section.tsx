"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

const buyerTypeData = [
  { name: "New", value: 25, color: "#3b82f6" },
  { name: "Repeat", value: 50, color: "#10b981" },
  { name: "Inactive", value: 225, color: "#9ca3af" },
]

const growthData = [
  { month: "Aug", buyers: 250 },
  { month: "Sep", buyers: 275 },
  { month: "Oct", buyers: 300 },
]

const newBuyers = [
  { id: "B-001", name: "Alice Johnson", date: "2024-10-15", location: "Manila" },
  { id: "B-002", name: "Bob Smith", date: "2024-10-14", location: "Cebu" },
  { id: "B-003", name: "Carol White", date: "2024-10-13", location: "Davao" },
  { id: "B-004", name: "David Brown", date: "2024-10-12", location: "Quezon City" },
]

export default function BuyersSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Buyers</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buyer Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buyer Statistics</CardTitle>
            <CardDescription>Overall metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">300</p>
                <p className="text-sm text-muted-foreground">Total Buyers</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">25</p>
                  <p className="text-xs text-muted-foreground">New</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">50</p>
                  <p className="text-xs text-muted-foreground">Repeat</p>
                </div>
              </div>
              <Button className="w-full bg-transparent" variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buyer Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={buyerTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {buyerTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Trend</CardTitle>
            <CardDescription>Last 3 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="buyers" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* New Buyers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">New Buyers</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Buyer ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                </tr>
              </thead>
              <tbody>
                {newBuyers.map((buyer) => (
                  <tr key={buyer.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-3 px-4 text-foreground">{buyer.id}</td>
                    <td className="py-3 px-4 text-foreground">{buyer.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{buyer.date}</td>
                    <td className="py-3 px-4 text-foreground">{buyer.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
