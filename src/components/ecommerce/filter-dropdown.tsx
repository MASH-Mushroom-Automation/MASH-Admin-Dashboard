"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

interface FilterDropdownProps {
  filterConfig: {
    seller: string
    paymentMethod: string
    dateRange: string
  }
  setFilterConfig: (config: { seller: string; paymentMethod: string; dateRange: string }) => void
}

const sellers = ["all", "MashMushroom Hut", "Mushroom Spot", "Kyzie Mushroom", "Fungi Farm"]
const paymentMethods = ["all", "Credit Card", "GCash"]
const dateRanges = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
]

export function FilterDropdown({ filterConfig, setFilterConfig }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        Filter
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-background shadow-lg">
          {/* Seller Filter */}
          <div className="border-b border-border p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Seller</p>
            <div className="space-y-2">
              {sellers.map((seller) => (
                <label key={seller} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="seller"
                    value={seller}
                    checked={filterConfig.seller === seller}
                    onChange={(e) => setFilterConfig({ ...filterConfig, seller: e.target.value })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-foreground capitalize">
                    {seller === "all" ? "All Sellers" : seller}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-b border-border p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Payment Method</p>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label key={method} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={filterConfig.paymentMethod === method}
                    onChange={(e) => setFilterConfig({ ...filterConfig, paymentMethod: e.target.value })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-foreground capitalize">
                    {method === "all" ? "All Methods" : method}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Date Range</p>
            <div className="space-y-2">
              {dateRanges.map((range) => (
                <label key={range.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="dateRange"
                    value={range.value}
                    checked={filterConfig.dateRange === range.value}
                    onChange={(e) => setFilterConfig({ ...filterConfig, dateRange: e.target.value })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-foreground">{range.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
