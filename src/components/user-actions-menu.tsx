// components/ui/actions-menu.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Eye, Edit2, Trash2 } from "lucide-react"
import Link from "next/link"

interface ActionsMenuProps {
  id: string
  viewUrl?: string     
  editUrl?: string   
  onDelete: () => void
  showView?: boolean
  showEdit?: boolean
  deleteLabel?: string
}

export function ActionsMenu({
  id,
  viewUrl,
  editUrl,
  onDelete,
  showView = true,
  showEdit = true,
  deleteLabel = "Delete",
}: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showView && viewUrl && (
          <DropdownMenuItem asChild>
            <Link href={viewUrl} className="flex items-center gap-2 cursor-pointer">
              <Eye className="h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
        )}
        {showEdit && editUrl && (
          <DropdownMenuItem asChild>
            <Link href={editUrl} className="flex items-center gap-2 cursor-pointer">
              <Edit2 className="h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive cursor-pointer flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}