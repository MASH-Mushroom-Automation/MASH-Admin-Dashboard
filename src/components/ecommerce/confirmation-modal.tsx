"use client"

import { Button } from "@/components/ui/button"

interface ConfirmationModalProps {
  title: string
  message: string
  confirmText: string
  confirmVariant?: "default" | "destructive"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  title,
  message,
  confirmText,
  confirmVariant = "default",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-sm w-full border border-border">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{message}</p>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} className="flex-1">
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
