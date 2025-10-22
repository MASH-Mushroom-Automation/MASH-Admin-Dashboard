"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const salesData = [
  { day: "Mon", sales: 2400 },
  { day: "Tue", sales: 1398 },
  { day: "Wed", sales: 9800 },
  { day: "Thu", sales: 3908 },
  { day: "Fri", sales: 4800 },
  { day: "Sat", sales: 3800 },
  { day: "Sun", sales: 4300 },
]

const orderStatusData = [
  { name: "Fulfilled", value: 140, color: "#10b981" },
  { name: "Pending", value: 40, color: "#f59e0b" },
  { name: "Canceled", value: 20, color: "#ef4444" },
]

const recentActivity = [
  { timestamp: "2024-10-15 14:30", event: "Order #1234 Placed", status: "Completed" },
  { timestamp: "2024-10-15 13:15", event: "Payment Received", status: "Completed" },
  { timestamp: "2024-10-15 12:00", event: "Shipment Dispatched", status: "In Progress" },
  { timestamp: "2024-10-15 10:45", event: "Order #1233 Placed", status: "Completed" },
]

export default function ECommerceSection() {
  return (
    <div  className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Summary</CardTitle>
            <CardDescription>Today&apos;s performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <p className="text-3xl font-bold text-foreground">₱310,820</p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-3xl font-bold text-foreground">200</p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">₱12,450</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> */}
        {/* Order Status */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {/* Recent Activity */}
        {/* <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.event}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      activity.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      {/* </div> */}
    </div>
  )
}
