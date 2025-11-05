"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit2, Trash2, MoreHorizontal, Check, X } from "lucide-react"
import { useState } from "react"

type ID = string | number

interface ContentItem {
  id: ID
  title: string
  type: string
  author: string
  status: string
  lastUpdated: string
}

interface ContentTableProps {
  contents: ContentItem[]
  onEdit: (content: ContentItem) => void
  onArchive: (id: ID) => void
  onPublishToggle: (id: ID) => void
  onPreview: (content: ContentItem) => void
}

export default function ContentTable({ contents, onEdit, onArchive, onPublishToggle, onPreview }: ContentTableProps) {
  const [ArchiveId, setArchiveId] = useState<ID | null>(null)

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800"
      case "Draft":
        return "bg-gray-100 text-gray-800"
      case "Pending Approval":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No content found</p>
                </TableCell>
              </TableRow>
            ) : (
              contents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">{content.title}</TableCell>
                  <TableCell>{content.type}</TableCell>
                  <TableCell>{content.author}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(content.status)}>{content.status}</Badge>
                  </TableCell>
                  <TableCell>{content.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onPreview(content)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(content)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPublishToggle(content.id)}>
                          {content.status === "Published" ? (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setArchiveId(content.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Archive Confirmation */}
      <AlertDialog open={ArchiveId !== null} onOpenChange={() => setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Archive Content</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to Archive this content? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (ArchiveId !== null) {
                  onArchive(ArchiveId)
                }
                setArchiveId(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
