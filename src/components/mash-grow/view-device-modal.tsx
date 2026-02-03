"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ViewDeviceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: { 
    id: string; 
    serialNumber?: string;
    name?: string;
    model?: string; 
    type?: string; 
    location?: string; 
    status?: string; 
    assigned?: boolean; 
    archived?: boolean; 
    description?: string;
    firmware?: string;
  }
}

export default function ViewDeviceModal({ open, onOpenChange, device }: ViewDeviceModalProps) {
  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-h-[70vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Device Details</DialogTitle>
          <DialogDescription>Device information</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Serial Number</div>
            <div className="font-mono">{device.serialNumber ?? '—'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-medium">{device.name ?? '—'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Model</div>
            <div className="font-medium">{device.model ?? '—'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Type</div>
            <div>{device.type ?? '—'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Location</div>
            <div className="truncate">{device.location ?? '—'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <div>{device.status ?? 'OFFLINE'}</div>
          </div>

          {device.firmware && (
            <div>
              <div className="text-sm text-muted-foreground">Firmware</div>
              <div className="font-mono">{device.firmware}</div>
            </div>
          )}

          <div>
            <div className="text-sm text-muted-foreground">Assigned</div>
            <div>{device.assigned ? 'Yes' : 'No'}</div>
          </div>

          {device.description && (
            <div>
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="whitespace-normal wrap-break-word">{device.description}</div>
            </div>
          )}

        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
