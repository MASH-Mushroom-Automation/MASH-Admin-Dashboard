"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Eye, Edit2, Trash2 } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  chamberNumber: string
  name: string
  address: string
  contactNumber: string
  status: "Active" | "Inactive"
  registrationDate: string
}

interface UserActionsMenuProps {
  user: User
  onDelete: () => void
}

export default function UserActionsMenu({ user, onDelete }: UserActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/view/${user.id}`} className="flex items-center gap-2 cursor-pointer">
            <Eye className="h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/edit/${user.id}`} className="flex items-center gap-2 cursor-pointer">
            <Edit2 className="h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive cursor-pointer">
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
