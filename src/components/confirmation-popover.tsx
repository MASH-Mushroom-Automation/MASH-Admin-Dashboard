"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ConfirmationPopoverProps {
  action: "accept" | "reject" | "Archive" | "Unarchive" | "logout"
  entity?: string
  // onConfirm may receive an optional reason for actions like 'reject'
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

export function ConfirmationPopover({ action, entity, onConfirm, onCancel }: ConfirmationPopoverProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [customReason, setCustomReason] = useState<string>("")

  // keep a simple static list - will be memoized inside the component to satisfy lint

  // preselect first reason for UX
  const presetReasons = useMemo(
    () => [
      "Incomplete business or personal information",
      "Invalid identification or verification documents",
      "Unverified contact information",
      "Submitted products are not valid or allowed on the platform",
      "Violation of seller application policies",
      "Suspicious or duplicate application",
      "Failure to meet platform requirements",
      "Other",
    ],
    []
  )

  useEffect(() => {
    if (action === "reject" && !selectedReason) {
      setSelectedReason(presetReasons[0])
    }
  }, [action, selectedReason, presetReasons])

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

  let title = "Confirm Action"
  let message = "Are you sure you want to perform this action?"
  let confirmText = "Confirm"

  if (action === "reject") {
    title = "Reject Seller"
    message = "Are you sure you want to reject this seller? Provide a reason for the rejection."
    confirmText = "Reject"
  } else if (action === "Archive") {
    const target = entity ? entity.toLowerCase() : "this item"
    title = `Archive ${entity || "Item"}`
    message = `Are you sure you want to Archive this ${target}? This action cannot be undone.`
    confirmText = "Archive"
  } else if (action === "Unarchive") {
    const target = entity ? entity.toLowerCase() : "this item"
    title = `Unarchive ${entity || "Item"}`
    message = `Are you sure you want to unarchive this ${target}?`
    confirmText = "Unarchive"
  } else if (action === "logout") {
    title = "Logout?"
    message = "Are you sure you want to logout?"
    confirmText = "Logout"
  } else if (action === "accept") {
    title = "Accept Seller"
    message = "Are you sure you want to accept this seller?"
    confirmText = "Accept"
  }

  const markup = (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => {
          setIsOpen(false)
          onCancel()
        }}
      />

      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{message}</p>

              {action === "reject" && (
                <div className="space-y-3 mb-4">
                  <label className="block text-sm font-medium">Reason for rejection</label>
                  <select className="w-full border rounded-md px-2 py-1" onChange={(e) => setSelectedReason(e.target.value)} value={selectedReason}>
                    <option value="">Select a reason</option>
                    {presetReasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {selectedReason === "Other" && (
                    <textarea
                      className="w-full border rounded-md px-2 py-1"
                      rows={3}
                      placeholder="Provide reason"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  )}
                </div>
              )}

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

                {action === "accept" || action === "Unarchive" ? (
                  <Button
                    onClick={() => {
                      setIsOpen(false)
                      onConfirm()
                    }}
                  >
                    {confirmText}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      let reason: string | undefined = undefined
                      if (action === "reject") {
                        reason = selectedReason === "Other" ? customReason || undefined : selectedReason || undefined
                      }
                      setIsOpen(false)
                      onConfirm(reason)
                    }}
                    disabled={action === "reject" && !selectedReason && !customReason}
                  >
                    {confirmText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (typeof document === "undefined") return null

  return createPortal(markup, document.body)
}
