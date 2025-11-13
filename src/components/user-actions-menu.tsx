// components/ui/actions-menu.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Eye, Edit2, Archive } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface ActionsMenuProps {
  id: string
  viewUrl?: string    
  editUrl?: string   
  onView?: () => void
  onEdit?: () => void
  onArchive: () => void
  children?: ReactNode
  showView?: boolean
  showEdit?: boolean
  ArchiveLabel?: string
}

export function ActionsMenu({
  viewUrl,
  editUrl,
  onArchive,
  onView,
  onEdit,
  showView = true,
  showEdit = true,
  ArchiveLabel = "Archive",
  children,
}: ActionsMenuProps) {
  // Render icon-only action buttons suitable for placement inside table cells.
  return (
    <div className="flex items-center gap-2">
      {showView && (onView ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onView}
          aria-label="View"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ) : viewUrl ? (
        <Link href={viewUrl} aria-label="View">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ) : null)}

      {showEdit && (onEdit ? (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit} aria-label="Edit">
          <Edit2 className="h-4 w-4" />
        </Button>
      ) : editUrl ? (
        <Link href={editUrl} aria-label="Edit">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit2 className="h-4 w-4" />
          </Button>
        </Link>
      ) : null)}

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-destructive"
        onClick={onArchive}
        aria-label={ArchiveLabel}
      >
        <Archive className="h-4 w-4" />
      </Button>
      {children}
    </div>
  )
}