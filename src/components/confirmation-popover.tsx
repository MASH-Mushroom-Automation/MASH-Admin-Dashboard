"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ConfirmationPopoverProps {
  action: "reject" | "delete"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationPopover({ action, onConfirm, onCancel }: ConfirmationPopoverProps) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onCancel])

  if (!isOpen) return null

  const message =
    action === "reject"
      ? "Are you sure you want to reject this seller?"
      : "Are you sure you want to delete this seller?"

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => {
          setIsOpen(false)
          onCancel()
        }}
      />

      {/* Popover */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {action === "reject" ? "Reject Seller" : "Delete Seller"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false)
                    onCancel()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsOpen(false)
                    onConfirm()
                  }}
                >
                  {action === "reject" ? "Reject" : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
