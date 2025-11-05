"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface CreateDeviceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (device: { id: string; deviceId: string; model: string; location: string; status: "Connected" | "Disconnected" }) => void
  // optional: when provided the modal works in edit mode
  initialDevice?: { id: string; deviceId: string; model: string; location: string; status: "Connected" | "Disconnected" }
}

export default function CreateDeviceModal({ open, onOpenChange, onSave, initialDevice }: CreateDeviceModalProps) {
  const [model, setModel] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState<"Connected" | "Disconnected">("Disconnected")
  const [editingId, setEditingId] = useState<string | undefined>(undefined)
  // helper: derive 3-letter model code (uppercase) from user-provided model
  const getModelCode = (m: string) => {
    if (!m) return "MOD"
    // keep only letters and numbers, remove spaces, then take first 3 chars
    const cleaned = m.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    return (cleaned + "XXX").slice(0, 3)
  }

  // previewDeviceId shows a live preview when model/location present
  const currentYear = new Date().getFullYear()
  const locationYearPreview = (location ? location.charAt(0).toUpperCase() : "X") + String(currentYear)
  const previewDecimal = "0000"
  const previewModelCode = getModelCode(model)
  const previewDeviceId = `MASH-${previewModelCode}-${locationYearPreview}-${previewDecimal}`

  useEffect(() => {
    if (open && initialDevice) {
      // populate form with initial device for edit
      setEditingId(initialDevice.id)
      setModel(initialDevice.model)
      setLocation(initialDevice.location)
      setStatus(initialDevice.status)
      // when editing, we keep the existing deviceId (not regenerating)
    }

    if (!open && !initialDevice) {
      setStatus("Disconnected")
      setEditingId(undefined)
    }
  }, [open, initialDevice])

  const handleCheckPing = async () => {
    // simulate network ping
    await new Promise((r) => setTimeout(r, 600))
    const isConnected = Math.random() > 0.3
    setStatus(isConnected ? "Connected" : "Disconnected")
  }

  const handleSave = () => {
    const id = editingId ?? String(Date.now())

    // compute deviceId using format: PREFIX-MODEL-LOCATIONYEAR-UNIQUEDECIMAL
    const prefix = "MASH"
  const modelCode = getModelCode(model)
    const yearPart = String(new Date().getFullYear())
    const locationCode = location ? location.charAt(0).toUpperCase() : "X"
    const locationYear = `${locationCode}${yearPart}`

    // determine next unique decimal by inspecting persisted devices
    let nextDecimal = 1
    try {
      const raw = localStorage.getItem("mash_devices")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          // find deviceIds that match our prefix-model-locationYear pattern and extract trailing number
          const regex = new RegExp(`^${prefix}-${modelCode}-${locationYear}-(\\d+)$`)
          const nums = parsed
            .map((d: any) => {
              const m = String(d.deviceId || "").match(regex)
              return m ? parseInt(m[1], 10) : null
            })
            .filter((n: number | null) => n !== null) as number[]
          if (nums.length > 0) {
            nextDecimal = Math.max(...nums) + 1
          } else {
            // fallback: increment by count
            nextDecimal = parsed.length + 1
          }
        }
      }
    } catch (e) {
      nextDecimal = Date.now() % 10000
    }

    const uniqueDecimal = String(nextDecimal).padStart(4, "0")
    const deviceIdGenerated = `${prefix}-${modelCode}-${locationYear}-${uniqueDecimal}`

    const device = { id, deviceId: deviceIdGenerated, model, location, status }
    onSave(device)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Device" : "Create Device"}</DialogTitle>
          <DialogDescription>Generate a new chamber device and check network configuration.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Model</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="A1" />
                </div>

                <div>
                  <Label className="text-sm">Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Caloocan" />
                </div>

                <div>
                  <Label className="text-sm">Chamber Device ID</Label>
                  <div className="font-mono py-2">{editingId ? initialDevice?.deviceId : previewDeviceId}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <Label className="text-sm">Network Configuration Status</Label>
                    <div className={`py-2 ${status === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>{status}</div>
                  </div>
                  <div className="ml-auto">
                    <Button variant="outline" onClick={handleCheckPing}>Check Ping</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editingId ? "Save Changes" : "Create Device"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
