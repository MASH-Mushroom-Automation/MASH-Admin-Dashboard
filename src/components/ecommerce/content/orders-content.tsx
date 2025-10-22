"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw, Search } from "lucide-react"
import { OrderLogsTable } from "../order-logs-table"
import { OrderDetailsDrawer } from "../order-details-drawer"
import { FilterDropdown } from "../filter-dropdown"

export type OrderStatus =
  | "all"
  | "pending-payment"
  | "shipment"
  | "failed-delivery"
  | "completed"
  | "refund-return"
  | "canceled"
  | "dispute"
  | "payment-verification"

export interface OrderLog {
  id: string
  sellerName: string
  orderId: string
  buyerName: string
  orderDate: string
  amount: number
  status: Exclude<OrderStatus, "all">
  lastUpdated: string
  paymentMethod?: string
  notes?: string
}

const mockOrderLogs: OrderLog[] = [
  {
    id: "1",
    sellerName: "TechStore Pro",
    orderId: "ORD-2024-001",
    buyerName: "John Doe",
    orderDate: "2024-10-20",
    amount: 299.99,
    status: "pending-payment",
    lastUpdated: "2024-10-22 14:30",
    paymentMethod: "Credit Card",
    notes: "Awaiting payment confirmation",
  },
  {
    id: "2",
    sellerName: "Fashion Hub",
    orderId: "ORD-2024-002",
    buyerName: "Jane Smith",
    orderDate: "2024-10-19",
    amount: 149.5,
    status: "shipment",
    lastUpdated: "2024-10-22 13:15",
    paymentMethod: "Debit Card",
    notes: "In transit to buyer",
  },
  {
    id: "3",
    sellerName: "Electronics World",
    orderId: "ORD-2024-003",
    buyerName: "Mike Johnson",
    orderDate: "2024-10-18",
    amount: 599.99,
    status: "failed-delivery",
    lastUpdated: "2024-10-22 12:00",
    paymentMethod: "PayPal",
    notes: "Delivery address not accessible",
  },
  {
    id: "4",
    sellerName: "TechStore Pro",
    orderId: "ORD-2024-004",
    buyerName: "Sarah Williams",
    orderDate: "2024-10-21",
    amount: 89.99,
    status: "completed",
    lastUpdated: "2024-10-22 11:45",
    paymentMethod: "Credit Card",
    notes: "Successfully delivered",
  },
  {
    id: "5",
    sellerName: "Home Essentials",
    orderId: "ORD-2024-005",
    buyerName: "Robert Brown",
    orderDate: "2024-10-20",
    amount: 249.0,
    status: "refund-return",
    lastUpdated: "2024-10-22 10:30",
    paymentMethod: "Debit Card",
    notes: "Return initiated by buyer",
  },
  {
    id: "6",
    sellerName: "Fashion Hub",
    orderId: "ORD-2024-006",
    buyerName: "Emily Davis",
    orderDate: "2024-10-17",
    amount: 179.99,
    status: "canceled",
    lastUpdated: "2024-10-22 09:20",
    paymentMethod: "Credit Card",
    notes: "Canceled by seller",
  },
  {
    id: "7",
    sellerName: "Electronics World",
    orderId: "ORD-2024-007",
    buyerName: "David Wilson",
    orderDate: "2024-10-16",
    amount: 459.99,
    status: "dispute",
    lastUpdated: "2024-10-22 08:15",
    paymentMethod: "PayPal",
    notes: "Dispute raised by buyer",
  },
  {
    id: "8",
    sellerName: "TechStore Pro",
    orderId: "ORD-2024-008",
    buyerName: "Lisa Anderson",
    orderDate: "2024-10-15",
    amount: 329.5,
    status: "payment-verification",
    lastUpdated: "2024-10-22 07:00",
    paymentMethod: "Bank Transfer",
    notes: "Payment verification in progress",
  },
]

export function OrdersContent() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<OrderLog | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [filterConfig, setFilterConfig] = useState({
    seller: "all",
    paymentMethod: "all",
    dateRange: "all",
  })

  const filteredLogs = mockOrderLogs.filter((log) => {
    const matchesTab = activeTab === "all" || log.status === activeTab
    const matchesSearch =
      searchQuery === "" ||
      log.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeller = filterConfig.seller === "all" || log.sellerName === filterConfig.seller
    const matchesPaymentMethod =
      filterConfig.paymentMethod === "all" || log.paymentMethod === filterConfig.paymentMethod
    return matchesTab && matchesSearch && matchesSeller && matchesPaymentMethod
  })

  const handleRowClick = (order: OrderLog) => {
    setSelectedOrder(order)
    setIsDrawerOpen(true)
  }

  const handleRefresh = () => {
    console.log("Refreshing logs...")
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Seller Order Logs</h1>
          <p className="mt-2 text-muted-foreground">Monitor real-time updates on seller transactions and deliveries.</p>
        </div>

        {/* Tabs and Controls */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatus)}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending-payment">Pending</TabsTrigger>
              <TabsTrigger value="shipment">Shipment</TabsTrigger>
              <TabsTrigger value="failed-delivery">Failed</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="refund-return">Refund</TabsTrigger>
              <TabsTrigger value="canceled">Canceled</TabsTrigger>
              <TabsTrigger value="dispute">Dispute</TabsTrigger>
              <TabsTrigger value="payment-verification">Verification</TabsTrigger>
            </TabsList>

            {/* Search and Filter Bar */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by seller name, order ID, or buyer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <FilterDropdown filterConfig={filterConfig} setFilterConfig={setFilterConfig} />
                <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh logs">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tab Contents - All tabs show filtered data */}
            {[
              "all",
              "pending-payment",
              "shipment",
              "failed-delivery",
              "completed",
              "refund-return",
              "canceled",
              "dispute",
              "payment-verification",
            ].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-6">
                <Card>
                  <OrderLogsTable logs={filteredLogs} onRowClick={handleRowClick} />
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Order Details Drawer */}
      {selectedOrder && (
        <OrderDetailsDrawer order={selectedOrder} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      )}
    </main>
  )
}
