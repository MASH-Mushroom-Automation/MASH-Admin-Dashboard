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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Device {
  id: string;
  deviceId: string;
  model: string;
  location: string;
  status: "Online" | "Offline";
  assigned: boolean;
  name?: string;
  type?: string;
  description?: string;
  firmware?: string;
  archived?: boolean;
}

interface CreateDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (device: Device) => void;
  // optional: when provided the modal works in edit mode
  initialDevice?: Device;
}

export default function CreateDeviceModal({
  open,
  onOpenChange,
  onSave,
  initialDevice,
}: CreateDeviceModalProps) {
  const [model, setModel] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [firmware, setFirmware] = useState("");
  
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [manualEdit, setManualEdit] = useState(false);
  const [seg1, setSeg1] = useState("MASH");
  const [seg2, setSeg2] = useState("");
  const [seg3, setSeg3] = useState("");
  const [seg4, setSeg4] = useState("");
  // helper: normalize model (keep alphanumeric, uppercase). Use full model token (e.g., A1, B1)
  const normalizeModel = (m: string) => {
    if (!m) return "MODEL";
    return m.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  };

  // generate a random uppercase alphanumeric string of given length
  const generateUniqueHex = (length = 6) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  };

  // build LocationYear: first 3 letters of location (uppercase) + last 2 digits of year
  const buildLocationYear = (loc: string, year?: number) => {
    const cleaned = (loc || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    const first3 = (cleaned + "XXX").slice(0, 3);
    const y = year ?? new Date().getFullYear();
    const last2 = String(y).slice(-2);
    return `${first3}${last2}`;
  };

  // generate a full CD Key with uniqueness check against localStorage devices
  const generateDeviceId = (m: string, loc: string) => {
    const prefix = "MASH";
    const modelCode = normalizeModel(m) || "MODEL";
    const locationYear = buildLocationYear(loc);

    // attempt to generate unique suffix and avoid collisions with stored devices
    let suffix = generateUniqueHex(6);
    try {
      const raw = localStorage.getItem("mash_devices");
      const parsed = raw ? JSON.parse(raw) : [];
      const existing = new Set(
        (Array.isArray(parsed) ? parsed : []).map((d: any) => String(d.deviceId || ""))
      );
      let attempts = 0;
      while (existing.has(`${prefix}-${modelCode}-${locationYear}-${suffix}`) && attempts < 10) {
        suffix = generateUniqueHex(6);
        attempts++;
      }
    } catch (e) {
      // ignore and proceed
    }

    return `${prefix}-${modelCode}-${locationYear}-${suffix}`;
  };

  // previewDeviceId shows a live preview when model/location present
  const currentYear = new Date().getFullYear();
  const previewLocationYear = buildLocationYear(location, currentYear);
  const previewModelCode = normalizeModel(model);
  const previewDeviceId = `MASH-${previewModelCode}-${previewLocationYear}-XXXXXX`;

  useEffect(() => {
    if (open && initialDevice) {
      // populate form with initial device for edit
      setEditingId(initialDevice.id);
      setName((initialDevice as any).name ?? "");
      setType((initialDevice as any).type ?? "");
      setDescription((initialDevice as any).description ?? "");
      setFirmware((initialDevice as any).firmware ?? "");
      setModel(initialDevice.model);
      setLocation(initialDevice.location);
      // populate segmented ID fields from existing deviceId if present
      const existingId = initialDevice.deviceId ?? null;
      if (existingId) {
        const parts = String(existingId).split("-");
        setSeg1(parts[0] ?? "MASH");
        setSeg2(parts[1] ?? normalizeModel(initialDevice.model));
        setSeg3(parts[2] ?? buildLocationYear(initialDevice.location));
        setSeg4(parts[3] ?? generateUniqueHex(6));
      } else {
        setSeg1("MASH");
        setSeg2(normalizeModel(initialDevice.model));
        setSeg3(buildLocationYear(initialDevice.location));
        setSeg4(generateUniqueHex(6));
      }
      setGeneratedId(initialDevice.deviceId ?? null);
      setManualEdit(false);
      // when editing, we keep the existing deviceId (not regenerating)
    }

    if (!open && !initialDevice) {
      setEditingId(undefined);
    }
  }, [open, initialDevice]);

  // Auto-generate ID when creating (not editing) and when model/location change,
  // but do not overwrite if user manually edited the ID field.
  useEffect(() => {
    if (!open) return;
    if (editingId) return; // editing existing device -> keep its id unless user edits
    if (manualEdit) return; // user manually edited -> don't auto overwrite
    // auto-fill segmented ID
    setSeg1("MASH");
    setSeg2(normalizeModel(model));
    setSeg3(buildLocationYear(location));
    // generate a unique suffix avoiding collisions
    let suffix = generateUniqueHex(6);
    try {
      const raw = localStorage.getItem("mash_devices");
      const parsed = raw ? JSON.parse(raw) : [];
      const existing = new Set(
        (Array.isArray(parsed) ? parsed : []).map((d: any) => String(d.deviceId || ""))
      );
      let attempts = 0;
      while (existing.has(`${"MASH"}-${normalizeModel(model)}-${buildLocationYear(location)}-${suffix}`) && attempts < 20) {
        suffix = generateUniqueHex(6);
        attempts++;
      }
    } catch (e) {
      // ignore
    }
    setSeg4(suffix);
  }, [model, location, open, editingId, manualEdit]);

  // helper to reset the form to defaults
  const resetForm = () => {
    setName("");
    setType("");
    setModel("");
    setLocation("");
    setDescription("");
    setFirmware("");
    setGeneratedId(null);
    setManualEdit(false);
    setSeg1("MASH");
    setSeg2("");
    setSeg3(buildLocationYear("") );
    setSeg4(generateUniqueHex(6));
    setEditingId(undefined);
  };

  // when modal closes, reset form so reopening starts empty
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // network ping removed — device saves are defaulted to offline

  const handleSave = () => {
    const id = editingId ?? String(Date.now());

    // assemble deviceId from segments; fallback to generator if any segment is missing
    const assembled = `${seg1}-${seg2}-${seg3}-${seg4}`;
    const deviceIdGenerated = seg1 && seg2 && seg3 && seg4 ? assembled : generateDeviceId(model, location);

    const device: Device = {
      id,
      deviceId: deviceIdGenerated,
      model,
      name,
      type,
      description,
      firmware,
      location,
      status: "Offline",
      assigned: false,
    };
    onSave(device);
    // always close modal after saving
    onOpenChange(false);
    // reset form so next open is empty
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Edit Device" : "Create Device"}
          </DialogTitle>
          <DialogDescription>
            Generate a new chamber device and check network configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Chamber Controller 01"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Type</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full text-left justify-start font-normal">
                        <span className={`${type ? "font-normal" : "text-muted-foreground font-normal"}`}>{type || "Select type"}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => setType("Mushroom Chamber")}>Mushroom Chamber</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setType("Laminar Flow hood")}>Laminar Flow hood</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Model</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., A1"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Caloocan"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Firmware</Label>
                  <Input
                    value={firmware}
                    onChange={(e) => setFirmware(e.target.value)}
                    placeholder="e.g., v1.0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                  />
                </div>

                <div>
                  <Label className="text-sm">Device ID</Label>
                  <div className="flex items-center gap-2 flex-nowrap">
                    <Input
                      value={seg1}
                      onChange={() => {}}
                      readOnly
                      className="w-16 text-center text-sm font-mono"
                    />
                    <div className="text-lg font-mono">-</div>
                    <Input
                      value={seg2}
                      onChange={(e) => {
                        if (!editingId) {
                          setSeg2(e.target.value.toUpperCase().slice(0, 4));
                          setManualEdit(true);
                        }
                      }}
                      className="w-20 text-center text-sm font-mono"
                      maxLength={4}
                      readOnly={Boolean(editingId)}
                    />
                    <div className="text-lg font-mono">-</div>
                    <Input
                      value={seg3}
                      onChange={(e) => {
                        if (!editingId) {
                          setSeg3(e.target.value.toUpperCase().slice(0, 5));
                          setManualEdit(true);
                        }
                      }}
                      className="w-20 text-center text-sm font-mono"
                      maxLength={5}
                      readOnly={Boolean(editingId)}
                    />
                    <div className="text-lg font-mono">-</div>
                    <Input
                      value={seg4}
                      onChange={(e) => {
                        if (!editingId) {
                          setSeg4(e.target.value.toUpperCase().slice(0, 6));
                          setManualEdit(true);
                        }
                      }}
                      className="w-24 text-center text-sm font-mono"
                      maxLength={6}
                      readOnly={Boolean(editingId)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{editingId ? "Device ID cannot be changed when editing" : "Format: MASH - MODEL - LOCYY - UNIQUE (e.g. MASH - B1 - CAL25 - H3JSA4)"}</p>
                </div>

                
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={![
            name,
            type,
            model,
            location,
            firmware,
            description,
            seg2,
            seg3,
            seg4,
          ].every((v) => String(v || "").trim().length > 0)}>
            {editingId ? "Save Changes" : "Create Device"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
