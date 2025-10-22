"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function generateUniqueDecimal(): string {
  const chars = "0123456789ABCDEF"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateLocationYear(address: string): string {
  if (!address.trim()) return ""
  const location = address.substring(0, 3).toUpperCase()
  const year = new Date().getFullYear().toString().slice(-2)
  return `${location}${year}`
}

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (data: any) => void
}

export default function RegisterModal({ open, onOpenChange, onSave }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    chamberName: "",
    contactNumber: "",
    address: "",
    model: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uniqueDecimal] = useState(generateUniqueDecimal())

  const locationYear = generateLocationYear(formData.address)
  const deviceId = `ID-MASH-${formData.model || "---"}-${locationYear || "---"}-${uniqueDecimal}`

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.chamberName.trim()) newErrors.chamberName = "Chamber Name is required"
    if (!formData.contactNumber.trim()) newErrors.contactNumber = "Contact Number is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.model.trim()) newErrors.model = "Model is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSave = () => {
    if (validateForm()) {
      const registrationData = {
        ...formData,
        locationYear,
        uniqueDecimal,
        deviceId,
      }
      console.log("Chamber and Device registered:", registrationData)
      onSave?.(registrationData)
      handleCancel()
    }
  }

  const handleCancel = () => {
    setFormData({
      chamberName: "",
      contactNumber: "",
      address: "",
      model: "",
    })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Chamber & Device</DialogTitle>
          <DialogDescription>Enter chamber information and device registration details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chamber Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chamber Information</CardTitle>
              <CardDescription>Enter the chamber details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chamberName" className="text-foreground font-medium">
                  Name
                </Label>
                <Input
                  id="chamberName"
                  name="chamberName"
                  placeholder="Enter chamber name"
                  value={formData.chamberName}
                  onChange={handleInputChange}
                  className={errors.chamberName ? "border-destructive" : ""}
                />
                {errors.chamberName && <p className="text-sm text-destructive">{errors.chamberName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="text-foreground font-medium">
                  Contact Number
                </Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="Enter contact number"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className={errors.contactNumber ? "border-destructive" : ""}
                />
                {errors.contactNumber && <p className="text-sm text-destructive">{errors.contactNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground font-medium">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Device Registration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Registration</CardTitle>
              <CardDescription>Device ID will be auto-generated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Prefix</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-foreground">MASH</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-foreground font-medium">
                  Model
                </Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="e.g., A1"
                  value={formData.model}
                  onChange={handleInputChange}
                  className={errors.model ? "border-destructive" : ""}
                />
                {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Location Year</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-foreground font-mono">{locationYear || "---"}</div>
                <p className="text-xs text-muted-foreground">Auto-generated from address and current year</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Unique Decimal</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-foreground font-mono">{uniqueDecimal}</div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Device ID</Label>
                <div className="px-3 py-2 bg-primary/10 rounded-md text-foreground font-mono border border-primary/20">
                  {deviceId}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
