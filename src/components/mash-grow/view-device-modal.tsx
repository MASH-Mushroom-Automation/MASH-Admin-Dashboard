"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Cpu, MapPin, Activity, Tag, Server, Layers, Globe } from "lucide-react"

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">Device Details</DialogTitle>
          </div>
          <DialogDescription>
            Detailed information for device <span className="font-mono text-primary font-medium">{device.serialNumber || device.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Tag className="w-3 h-3" /> Name
              </span>
              <span className="font-medium text-lg">{device.name || "—"}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Layers className="w-3 h-3" /> Model / Type
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{device.model || "—"}</span>
                <span className="text-muted-foreground">•</span>
                <span>{device.type || "—"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </span>
              <span>{device.location || "—"}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Activity className="w-3 h-3" /> Status
              </span>
              <div>
                <Badge variant={device.status === 'Online' ? 'default' : 'secondary'} className={device.status === 'Online' ? 'bg-green-500' : ''}>
                  {device.status || "OFFLINE"}
                </Badge>
                {device.assigned && <Badge variant="outline" className="ml-2">Assigned</Badge>}
                {device.archived && <Badge variant="destructive" className="ml-2">Archived</Badge>}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Server className="w-3 h-3" /> Firmware
              </span>
              <span className="font-mono">{device.firmware || "—"}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Globe className="w-3 h-3" /> Serial Number
              </span>
              <span className="font-mono text-sm">{device.serialNumber || "—"}</span>
            </div>
          </div>
        </div>
        
        {device.description && (
          <div className="mt-2 p-3 bg-muted/50 rounded-md border text-sm">
             <span className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Description</span>
             {device.description}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
