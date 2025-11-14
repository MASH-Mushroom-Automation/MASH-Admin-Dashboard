"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ViewUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: { id: string; name: string; chamberNumber?: string; address?: string; contactNumber?: string; deviceId?: string; email?: string; firstName?: string; lastName?: string; phoneNumber?: string }
}

export default function ViewUserModal({ open, onOpenChange, user }: ViewUserModalProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Complete registration details</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{user.email ?? '—'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">First name</div>
            <div className="font-medium">{user.firstName ?? '—'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Last name</div>
            <div className="font-medium">{user.lastName ?? '—'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Phone number</div>
            <div>{user.phoneNumber ?? user.contactNumber ?? '—'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Chamber</div>
            <div className="font-mono">{user.chamberNumber ?? '—'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Address</div>
            <div className="truncate">{user.address ?? '—'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Device</div>
            <div className="font-mono">{user.deviceId ?? '—'}</div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
