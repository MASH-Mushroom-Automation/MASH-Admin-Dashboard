"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { SearchFilterBar } from "@/components/search-filter-bar"
import { OrderLogsTable } from "@/components/ecommerce/order-logs-table"
import { OrderDetailsDrawer } from "@/components/ecommerce/order-details-drawer"
import PaginationWrapper from "@/components/pagination"

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
    sellerName: "Mushroom Hut",
    orderId: "ORD-2024-001",
    buyerName: "Maria Angela",
    orderDate: "2024-10-20",
    amount: 299.99,
    status: "pending-payment",
    lastUpdated: "2024-10-22 14:30",
    paymentMethod: "Credit Card",
    notes: "Awaiting payment confirmation",
  },
  {
    id: "2",
    sellerName: "Kyzie Mushroom",
    orderId: "ORD-2024-002",
    buyerName: "Ellaine Pollocino",
    orderDate: "2024-10-19",
    amount: 149.5,
    status: "shipment",
    lastUpdated: "2024-10-22 13:15",
    paymentMethod: "GCash",
    notes: "In transit to buyer",
  },
  {
    id: "3",
    sellerName: "Fungi Farm",
    orderId: "ORD-2024-003",
    buyerName: "Mike Reyes",
    orderDate: "2024-10-18",
    amount: 599.99,
    status: "completed",
    lastUpdated: "2024-10-22 12:00",
    paymentMethod: "GCash",
    notes: "Delivery address not accessible",
  },
  {
    id: "4",
    sellerName: "Shroom Spot",
    orderId: "ORD-2024-004",
    buyerName: "John Pascal",
    orderDate: "2024-10-21",
    amount: 89.99,
    status: "canceled",
    lastUpdated: "2024-10-22 11:45",
    paymentMethod: "GCash",
    notes: "Successfully delivered",
  },
  {
    id: "5",
    sellerName: "Mushroom Spot",
    orderId: "ORD-2024-005",
    buyerName: "Donny Cruz",
    orderDate: "2024-10-20",
    amount: 249.0,
    status: "refund-return",
    lastUpdated: "2024-10-22 10:30",
    paymentMethod: "GCash",
    notes: "Return initiated by buyer",
  },
  {
    id: "6",
    sellerName: "Mushroom Hub",
    orderId: "ORD-2024-006",
    buyerName: "Alex Cruz",
    orderDate: "2024-10-19",
    amount: 200.0,
    status: "completed",
    lastUpdated: "2024-10-22 09:30",
    paymentMethod: "GCash",
    notes: "Delivered successfully",
  },
  {
    id: "7",
    sellerName: "Mushroom Lane",
    orderId: "ORD-2024-007",
    buyerName: "Jane Doe",
    orderDate: "2024-10-18",
    amount: 150.0,
    status: "pending-payment",
    lastUpdated: "2024-10-22 08:15",
    paymentMethod: "Credit Card",
    notes: "Awaiting confirmation",
  },
]

export default function OrdersContent() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<OrderLog | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [filterConfig, setFilterConfig] = useState({
    seller: "all",
    paymentMethod: "all",
    dateRange: "all",
  })

  const filteredLogs = useMemo(() => {

    return mockOrderLogs.filter((log) => {
      const matchesTab = activeTab === "all" || log.status === activeTab
      const matchesSearch =
        searchQuery === "" ||
        log.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSeller = filterConfig.seller === "all" || log.sellerName === filterConfig.seller
      const matchesPayment =
        filterConfig.paymentMethod === "all" || log.paymentMethod === filterConfig.paymentMethod
      return matchesTab && matchesSearch && matchesSeller && matchesPayment
    })
  }, [activeTab, searchQuery, filterConfig])

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)
  const sellerOptions = useMemo(() => {
    const sellers = Array.from(new Set(mockOrderLogs.map((m) => m.sellerName)))
    return [{ value: "all", label: "All Sellers" }, ...sellers.map((s) => ({ value: s, label: s }))]
  }, [])

  const paymentOptions = useMemo(() => {
    const payments = Array.from(new Set(mockOrderLogs.map((m) => m.paymentMethod || "unknown")))
    return [{ value: "all", label: "All Payments" }, ...payments.map((p) => ({ value: p, label: p }))]
  }, [])

  const handleRowClick = (order: OrderLog) => {
    setSelectedOrder(order)
    setIsDrawerOpen(true)
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="sm:text-3xl text-2xl font-bold">Seller Order Logs</h1>
          <p className="text-muted-foreground mt-1 mb-5 sm:text-base text-sm">
            Monitor real-time updates on seller transactions and deliveries.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value as OrderStatus)
          setCurrentPage(1)
        }}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-16 sm:mb-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending-payment">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="refund-return">Refund</TabsTrigger>
            <TabsTrigger value="canceled">Canceled</TabsTrigger>
            <TabsTrigger value="payment-verification">Verification</TabsTrigger>
          </TabsList>

          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q)
              setCurrentPage(1)
            }}
            placeholder="Search by seller, order ID, or buyer..."

            filter1Value={filterConfig.seller}
            onFilter1Change={(val) => setFilterConfig({ ...filterConfig, seller: val })}
            filter1Options={sellerOptions}
            filter1Label="All Sellers"

            filter2Value={filterConfig.paymentMethod}
            onFilter2Change={(val) => setFilterConfig({ ...filterConfig, paymentMethod: val })}
            filter2Options={paymentOptions}
            filter2Label="All Payments"
          />
          <TabsContent value={activeTab}>
            <Card>
              <OrderLogsTable logs={paginatedLogs} onRowClick={handleRowClick} />
            </Card>

            {/* Pagination */}
            <div className="mt-4">
              <PaginationWrapper
                totalItems={filteredLogs.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                label="orders"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedOrder && (
        <OrderDetailsDrawer
          order={selectedOrder}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </main>
  )
}
