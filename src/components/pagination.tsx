"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationWrapperProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  label?: string;
  rowsPerPageOptions?: number[];
  onItemsPerPageChange?: (n: number) => void;
}

/** Returns the page numbers (and "ellipsis" markers) to render.
 *  Always shows: first 2, last 2, and up to 2 siblings around current page.
 *  Gaps become an "..." marker. */
function getPageRange(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>();
  // Anchor pages
  pages.add(1);
  pages.add(2);
  pages.add(total - 1);
  pages.add(total);
  // Siblings
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | "..."> = [];
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i + 1 < sorted.length && sorted[i + 1] - sorted[i] > 1) {
      result.push("...");
    }
  }
  return result;
}

export default function PaginationWrapper({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  label = "items",
  rowsPerPageOptions,
  onItemsPerPageChange,
}: PaginationWrapperProps) {
  const totalPages =
    totalItems === 0 ? 0 : Math.ceil(totalItems / itemsPerPage);
  const showControls = totalPages > 1;

  return (
    <div className="w-full border-t border-border bg-muted/30 py-4 mt-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          {rowsPerPageOptions &&
            rowsPerPageOptions.length > 0 &&
            onItemsPerPageChange && (
              <div className="flex items-center">
                <label className="text-sm text-muted-foreground mr-2 hidden sm:block">
                  Rows per page:
                </label>
                <label className="text-sm text-muted-foreground sm:hidden mr-2">
                  Rows:
                </label>
                <select
                  className="rounded-md border px-2 py-1 text-sm transition-shadow duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={itemsPerPage}
                  onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                >
                  {rowsPerPageOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* Full label (desktop) */}
          <p className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
            Page {totalPages === 0 ? 0 : currentPage} of {totalPages} (
            {totalItems} {label})
          </p>

          {/* Compact label (mobile) */}
          <p className="text-sm text-muted-foreground whitespace-nowrap sm:hidden">
            {totalPages === 0 ? `0/0` : `${currentPage}/${totalPages}`}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          {/* Full pagination (shown on sm+) */}
          <div className="hidden sm:flex">
            {showControls ? (
              <Pagination className="flex justify-end">
                <PaginationContent className="flex items-center space-x-1">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) onPageChange(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {getPageRange(currentPage, totalPages).map((page, i) =>
                    page === "..." ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            onPageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          onPageChange(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : (
              <div className="flex items-center space-x-2">
                <button className="h-8 px-3 rounded-md border border-input bg-background text-sm pointer-events-none opacity-50">
                  ‹
                </button>
                <div className="text-sm text-muted-foreground">
                  {totalPages === 0 ? "0" : "1"}
                </div>
                <button className="h-8 px-3 rounded-md border border-input bg-background text-sm pointer-events-none opacity-50">
                  ›
                </button>
              </div>
            )}
          </div>

          {/* Compact pagination (mobile) */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (showControls && currentPage > 1)
                  onPageChange(currentPage - 1);
              }}
              aria-label="Previous page"
              className={`h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background text-sm ${!showControls || currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-muted/50"}`}
            >
              ‹
            </button>

            <span className="text-sm font-medium">
              {totalPages === 0 ? `0 / 0` : `${currentPage} / ${totalPages}`}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (showControls && currentPage < totalPages)
                  onPageChange(currentPage + 1);
              }}
              aria-label="Next page"
              className={`h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background text-sm ${!showControls || currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted/50"}`}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
