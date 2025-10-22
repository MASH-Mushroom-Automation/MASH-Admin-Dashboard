"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type Content = {
  title: string
  type: string
  status: "Published" | "Draft" | "Pending Approval" | string
  author: string
  lastUpdated: string
  content?: string | null
}

type Props = {
  content: Content
  onClose: (open?: boolean) => void
}

export default function ContentPreview({ content, onClose }: Props) {
  const getStatusColor = (status: string) => {
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Content</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-border pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">{content.title}</h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{content.type}</Badge>
                  <Badge className={getStatusColor(content.status)}>{content.status}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Author</p>
              <p className="font-medium text-foreground">{content.author}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium text-foreground">{content.lastUpdated}</p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Content Preview</p>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {content.content || "No content available"}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={() => onClose(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
