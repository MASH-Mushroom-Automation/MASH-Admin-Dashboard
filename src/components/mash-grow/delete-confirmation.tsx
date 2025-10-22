"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface DeleteConfirmationProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmation({ onConfirm, onCancel }: DeleteConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Delete User</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
