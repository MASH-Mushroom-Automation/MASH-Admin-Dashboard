"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason?: string) => void
}

export default function RejectReasonModal({ open, onOpenChange, onConfirm }: Props) {
  const presetReasons = [
    "Incomplete business or personal information",
    "Invalid identification or verification documents",
    "Unverified contact information",
    "Submitted products are not valid or allowed on the platform",
    "Violation of seller application policies",
    "Suspicious or duplicate application",
    "Failure to meet platform requirements",
    "Other",
  ]

  const [selectedReason, setSelectedReason] = useState<string>(presetReasons[0])
  const [customReason, setCustomReason] = useState<string>("")

  useEffect(() => {
    if (open) {
      setSelectedReason(presetReasons[0])
      setCustomReason("")
    }
  }, [open])

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleConfirm = () => {
    const reason = selectedReason === "Other" ? (customReason || undefined) : selectedReason
    onConfirm(reason)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject Seller</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">Select a reason for rejecting this seller.</p>
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <select
              className="w-full border rounded-md px-2 py-1"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              {presetReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === "Other" && (
            <div>
              <label className="block text-sm font-medium mb-2">Custom reason</label>
              <textarea
                className="w-full border rounded-md px-2 py-1"
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button
            className="bg-destructive text-destructive-foreground"
            onClick={handleConfirm}
            disabled={selectedReason === "Other" && customReason.trim() === ""}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
