"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface FilterOption {
  value: string
  label: string
}

interface SearchFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string

  filter1Value?: string
  onFilter1Change?: (value: string) => void
  filter1Options?: FilterOption[]
  filter1Label?: string

  filter2Value?: string
  onFilter2Change?: (value: string) => void
  filter2Options?: FilterOption[]
  filter2Label?: string
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search by name, email, or username...",

  filter1Value,
  onFilter1Change,
  filter1Options = [],
  filter1Label = "All Roles",

  filter2Value,
  onFilter2Change,
  filter2Options = [],
  filter2Label = "All Status",
}: SearchFilterBarProps) {
  const hasFilter1 = filter1Options.length > 0
  const hasFilter2 = filter2Options.length > 0

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      {/* Search input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full pl-10 pr-4 text-sm rounded-md border border-input bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Filters wrapper: stack on small screens, inline on sm+ */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
        {/* Filter 1 */}
        {hasFilter1 && (
          <Select value={filter1Value} onValueChange={onFilter1Change!}>
            <SelectTrigger className="h-10 w-full sm:w-auto rounded-md border border-input bg-background text-sm font-medium">
              <SelectValue placeholder={filter1Label} />
            </SelectTrigger>
            <SelectContent>
              {filter1Options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filter 2 */}
        {hasFilter2 && (
          <Select value={filter2Value} onValueChange={onFilter2Change!}>
            <SelectTrigger className="h-10 w-full sm:w-36 rounded-md border border-input bg-background text-sm font-medium leading-none">
              <SelectValue placeholder={filter2Label} />
            </SelectTrigger>
            <SelectContent>
              {filter2Options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
