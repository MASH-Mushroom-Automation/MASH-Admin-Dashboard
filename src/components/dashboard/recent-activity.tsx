"use client"

import { Package, UserCheck, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const activities = [
  {
    id: 1,
    icon: <Package className="w-4 h-4" />,
    title: "New order #MASH-1002 placed",
    description: "Fresh produce bundle",
    time: "2h ago",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: 2,
    icon: <UserCheck className="w-4 h-4" />,
    title: "Fungi Fresh Farms applied",
    description: "Application to be seller",
    time: "Yesterday",
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: 3,
    icon: <Truck className="w-4 h-4" />,
    title: "Order #MASH-0999 shipped",
    description: "by Green Harvest",
    time: "Yesterday 3:20 PM",
    color: "bg-green-100 text-green-600",
  },
]

export default function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className={`p-6 rounded-lg ${activity.color} flex-shrink-0`}>{activity.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
