"use client";
/* eslint-disable */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { generateDeviceId, validateLuhn } from "@/lib/luhn";
import { 
  DeviceModel, 
  DeviceType,
  MODEL_DESCRIPTIONS,
  DEVICE_TYPE_LABELS 
} from "@/types/device";
import { toast } from "sonner";

interface DeviceLocal {
  id: string;
  serialNumber: string;
  model: string;
  version: number;
  location: string;
  status: "Online" | "Offline";
  assigned?: boolean;
  name?: string;
  type?: DeviceType;
  description?: string;
  firmware?: string;
  archived?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

interface CreateDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (device: DeviceLocal) => void;
  initialDevice?: DeviceLocal;
}

export default function CreateDeviceModal({
  open,
  onOpenChange,
  onSave,
  initialDevice,
}: CreateDeviceModalProps) {
  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState<DeviceType>("MUSHROOM_CHAMBER");
  const [modelType, setModelType] = useState<DeviceModel>("A");
  const [version, setVersion] = useState<number>(1);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [firmware, setFirmware] = useState("");
  
  // Generated ID state
  const [generatedSerialNumber, setGeneratedSerialNumber] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // Track if form has changes (for edit mode)
  const [hasChanges, setHasChanges] = useState(false);

  // Generate device ID whenever model, version, or location changes
  useEffect(() => {
    if (!open) return;
    if (isEditMode) return; // Don't regenerate in edit mode

    if (modelType && version && location) {
      try {
        const serialNumber = generateDeviceId(modelType, version, location);
        setGeneratedSerialNumber(serialNumber);
      } catch (error) {
        console.error("Error generating device ID:", error);
        toast.error("Failed to generate device ID");
      }
    }
  }, [modelType, version, location, open, isEditMode]);

  // Initialize form with edit data
  useEffect(() => {
    if (open && initialDevice) {
      setIsEditMode(true);
      setName(initialDevice.name || "");
      setType((initialDevice.type as DeviceType) || "MUSHROOM_CHAMBER");
      
      // Parse model and version from serialNumber (format: MASH-B2-CAL26-######)
      const serialParts = initialDevice.serialNumber?.split("-") || [];
      if (serialParts.length >= 2) {
        const modelVersion = serialParts[1]; // e.g., "B2"
        const parsedModel = modelVersion.charAt(0) as DeviceModel; // "B"
        const parsedVersion = parseInt(modelVersion.substring(1)) || 1; // "2"
        setModelType(parsedModel);
        setVersion(parsedVersion);
      } else {
        setModelType("A");
        setVersion(1);
      }
      
      setLocation(initialDevice.location || "");
      setDescription(initialDevice.description || "");
      setFirmware(initialDevice.firmware || "");
      setGeneratedSerialNumber(initialDevice.serialNumber || "");
      setHasChanges(false); // Reset change tracking
    } else if (!open) {
      // Reset form when modal closes
      resetForm();
    }
  }, [open, initialDevice]);

  const resetForm = () => {
    setName("");
    setType("MUSHROOM_CHAMBER");
    setModelType("A");
    setVersion(1);
    setLocation("");
    setDescription("");
    setFirmware("");
    setGeneratedSerialNumber("");
    setIsEditMode(false);
  };

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      toast.error("Device name is required");
      return;
    }
    if (!location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!generatedSerialNumber) {
      toast.error("Failed to generate device ID");
      return;
    }

    // Validate Luhn check digit
    const hexPart = generatedSerialNumber.split("-")[3];
    if (hexPart && !validateLuhn(hexPart)) {
      toast.error("Generated device ID has invalid check digit");
      return;
    }

    const device: DeviceLocal = {
      id: initialDevice?.id || String(Date.now()),
      serialNumber: generatedSerialNumber,
      name: name.trim(),
      type,
      model: modelType,
      version,
      location: location.trim(),
      description: description.trim(),
      firmware: firmware.trim(),
      status: "Offline",
      assigned: false,
    };

    onSave(device);
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Device" : "Create New Device"}
          </DialogTitle>
          <DialogDescription>
            Generate a unique device ID using Luhn Modulo N algorithm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Device Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Device Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Chamber Controller 01"
                  />
                </div>

                {/* Device Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Device Type *</Label>
                  <Select value={type} onValueChange={(value) => setType(value as DeviceType)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEVICE_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model Type */}
                <div className="space-y-2">
                  <Label htmlFor="model">Model Type *</Label>
                  <Select 
                    value={modelType} 
                    onValueChange={(value) => setModelType(value as DeviceModel)}
                    disabled={isEditMode}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select model type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MODEL_DESCRIPTIONS).map(([key, description]) => (
                        <SelectItem key={key} value={key}>
                          {key} - {description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      Model type cannot be changed in edit mode
                    </p>
                  )}
                </div>

                {/* Version */}
                <div className="space-y-2">
                  <Label htmlFor="version">Version Number *</Label>
                  <Input
                    id="version"
                    type="number"
                    min={1}
                    max={99}
                    value={version}
                    onChange={(e) => setVersion(parseInt(e.target.value) || 1)}
                    disabled={isEditMode}
                    placeholder="e.g., 1"
                  />
                  {isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      Version cannot be changed in edit mode
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isEditMode}
                    placeholder="e.g., Caloocan, Manila, Cebu"
                  />
                  {isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      Location cannot be changed in edit mode
                    </p>
                  )}
                </div>

                {/* Firmware */}
                <div className="space-y-2">
                  <Label htmlFor="firmware">Firmware Version</Label>
                  <Input
                    id="firmware"
                    value={firmware}
                    onChange={(e) => setFirmware(e.target.value)}
                    placeholder="e.g., v1.0.0"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional device description"
                  />
                </div>

                {/* Generated Device ID */}
                <div className="space-y-2">
                  <Label>Generated Device ID</Label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {generatedSerialNumber || "MASH-XX-XXXXX-XXXXXX"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: MASH-{modelType}{version}-{location.slice(0, 3).toUpperCase() || "XXX"}{new Date().getFullYear().toString().slice(-2)}-[6-digit HEX with Luhn check]
                  </p>
                  <p className="text-xs text-green-600">
                    ✓ ID validated with Luhn Modulo N algorithm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={
              !name.trim() || 
              !location.trim() || 
              !generatedSerialNumber
            }
          >
            {isEditMode ? "Save Changes" : "Create Device"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
