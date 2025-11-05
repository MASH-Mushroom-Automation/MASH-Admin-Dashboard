"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationWrapperProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  label?: string
}

export default function PaginationWrapper({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  label = "items",
}: PaginationWrapperProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  if (totalPages <= 1) return null // hide if 1 page only

  return (
    <div className="w-full border-t border-border bg-muted/30 py-4 mt-4">
      <div className="flex items-center justify-between w-full">
        {/* Full label (desktop) */}
        <p className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
          Page {currentPage} of {totalPages} ({totalItems} {label})
        </p>

        {/* Compact label (mobile) */}
        <p className="text-sm text-muted-foreground whitespace-nowrap sm:hidden">
          {currentPage}/{totalPages}
        </p>

        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          {/* Full pagination (shown on sm+) */}
          <div className="hidden sm:flex">
            <Pagination className="flex justify-end">
              <PaginationContent className="flex items-center space-x-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) onPageChange(currentPage - 1)
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={(e) => {
                        e.preventDefault()
                        onPageChange(i + 1)
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) onPageChange(currentPage + 1)
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Compact pagination (shown on mobile) */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) onPageChange(currentPage - 1)
              }}
              aria-label="Previous page"
              className={`h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-muted/50"}`}
            >
              ‹
            </button>

            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) onPageChange(currentPage + 1)
              }}
              aria-label="Next page"
              className={`h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted/50"}`}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
