"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AssignDeviceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableDevices: { id: string; deviceId: string; status?: string }[]
  onAssign: (selectedDeviceId: string | undefined) => void
}

export default function AssignDeviceModal({ open, onOpenChange, availableDevices, onAssign }: AssignDeviceModalProps) {
  const [selected, setSelected] = useState<string | undefined>(undefined)

  const handleSave = () => {
    onAssign(selected)
    setSelected(undefined)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelected(undefined)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Device</DialogTitle>
          <DialogDescription>Select an available device to assign to the user.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-foreground font-medium">Select available device</Label>
            <Select value={selected} onValueChange={(v) => setSelected(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={availableDevices.length > 0 ? "Choose a device" : "No devices available"} />
              </SelectTrigger>
              <SelectContent>
                {availableDevices.length > 0 ? (
                  availableDevices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono">{d.deviceId}</span>
                        {d.status && (
                          <span className={`text-sm ${d.status === 'Online' ? 'text-green-600' : 'text-red-600'}`}>{d.status}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__no_devices_available" disabled>
                    No devices available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selected}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
