"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { SearchFilterBar } from "@/components/search-filter-bar"
import { OrderLogsTable } from "@/components/ecommerce/order-logs-table"
import { OrderDetailsDrawer } from "@/components/ecommerce/order-details-drawer"
import PaginationWrapper from "@/components/pagination"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

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
  // Bulk checkbox filters (status is handled by the tabs)
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [selectedSellers, setSelectedSellers] = useState<string[]>([])

  const filteredLogs = useMemo(() => {
    return mockOrderLogs.filter((log) => {
      // Status matching is handled by the tabs only (no status checkboxes in the dropdown)
      const matchesStatus = activeTab === "all" || log.status === activeTab

      const matchesSearch =
        searchQuery === "" ||
        log.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.buyerName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPayment = selectedPayments.length > 0 ? selectedPayments.includes(log.paymentMethod || "unknown") : true

      const matchesSeller = selectedSellers.length > 0 ? selectedSellers.includes(log.sellerName) : true

      return matchesStatus && matchesSearch && matchesPayment && matchesSeller
    })
  }, [activeTab, searchQuery, selectedPayments, selectedSellers])

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
    
      <div className="w-full px-4 py-8 overflow-x-hidden">
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

          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="flex-1 -mb-6">
                  <SearchFilterBar
                    searchQuery={searchQuery}
                    onSearchChange={(q) => {
                      setSearchQuery(q)
                      setCurrentPage(1)
                    }}
                    placeholder="Search by seller, order ID, or buyer..."
                  />
                </div>

                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center py-4.5">
                        <span className="font-medium">Filters</span>
                        { (selectedPayments.length + selectedSellers.length) > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">
                            {selectedPayments.length + selectedSellers.length}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-64 p-2">
                      
                      {/* Status removed from dropdown - tabs control status */}

                      <DropdownMenuLabel>Payment</DropdownMenuLabel>
                      <div className="px-1">
                        {paymentOptions.map((p) => (
                          <label key={p.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                            <input
                              type="checkbox"
                              className="rounded-sm"
                              checked={selectedPayments.includes(p.value)}
                              onChange={(e) => {
                                const val = e.target.checked
                                setCurrentPage(1)
                                setSelectedPayments((prev) => (val ? Array.from(new Set([...prev, p.value])) : prev.filter((x) => x !== p.value)))
                              }}
                            />
                            <span className="text-sm">{p.label}</span>
                          </label>
                        ))}
                      </div>

                      <DropdownMenuSeparator />

                      <DropdownMenuLabel>Seller</DropdownMenuLabel>
                      <div className="px-1">
                        {sellerOptions.slice(1).map((s) => (
                          <label key={s.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent">
                            <input
                              type="checkbox"
                              className="rounded-sm"
                              checked={selectedSellers.includes(s.value)}
                              onChange={(e) => {
                                const val = e.target.checked
                                setCurrentPage(1)
                                setSelectedSellers((prev) => (val ? Array.from(new Set([...prev, s.value])) : prev.filter((x) => x !== s.value)))
                              }}
                            />
                            <span className="text-sm">{s.label}</span>
                          </label>
                        ))}
                      </div>

                      <DropdownMenuSeparator />

                      <div className="px-1">
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedPayments(paymentOptions.map((p) => p.value))
                            setSelectedSellers(sellerOptions.slice(1).map((s) => s.value))
                            setCurrentPage(1)
                          }}
                        >
                          Select all
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedPayments([])
                            setSelectedPayments([])
                            setSelectedSellers([])
                            setCurrentPage(1)
                          }}
                        >
                          Clear
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* spacer for alignment if needed */}
            <div className="flex items-center -mt-2"></div>
          </div>
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
      

      {selectedOrder && (
        <OrderDetailsDrawer
          order={selectedOrder}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
      </div>
  )
}
