"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function generateUniqueDecimal(): string {
  const chars = "0123456789ABCDEF";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateLocationYear(address: string): string {
  if (!address.trim()) return "";
  const location = address.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  return `${location}${year}`;
}

interface RegisterData {
  chamberName: string;
  contactNumber: string;
  address: string;
  model?: string;
  locationYear: string;
  uniqueDecimal: string;
  deviceId: string;
}

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: RegisterData & { selectedDeviceId?: string }) => void;
  availableDevices?: { id: string; deviceId: string; status?: string }[];
  // optional initial data for edit
  initialData?: Partial<
    RegisterData & { id?: string; selectedDeviceId?: string }
  >;
}
export default function RegisterModal({
  open,
  onOpenChange,
  onSave,
  availableDevices,
  initialData,
}: RegisterModalProps) {
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  type FormState = {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    model: string;
  };

  const [formData, setFormData] = useState<FormState>({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    model: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uniqueDecimal] = useState(generateUniqueDecimal());
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined
  );

  type UserLocal = {
    id: string
    name?: string
    email?: string
    firstName?: string
    lastName?: string
    contactNumber?: string
    phoneNumber?: string
    address?: string
    deviceId?: string
    archived?: boolean
  }
  const [users, setUsers] = useState<UserLocal[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mash_users")
      if (!raw) return setUsers([])
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setUsers(parsed.filter((u) => !u.archived))
      else setUsers([])
    } catch {
      setUsers([])
    }
  }, [open])

  const locationYear = "";
  const deviceId = `MASH-${formData.model || "---"}-${
    locationYear || "---"
  }-${uniqueDecimal}`;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
      // If an existing user is selected, skip requiring user info inputs (they're read-only)
      if (!selectedUserId) {
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
      }
    // If the user selected an existing device, model is not required (device already exists).
    if (!selectedDeviceId && !formData.model.trim())
      newErrors.model = "Model is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof FormState;
    let newValue = value;
    // For phone number, strip out non-numeric characters but allow a single leading +
    if (name === "phoneNumber") {
      newValue = newValue.replace(/[^\d+]/g, "");
      // remove any + that is not the first character
      const firstPlus = newValue.indexOf("+");
      if (firstPlus > 0) {
        newValue = newValue.replace(/\+/g, "");
      } else if (firstPlus === 0) {
        // keep only the first +
        newValue = "+" + newValue.slice(1).replace(/\+/g, "");
      }
    }
    // For names, allow letters, spaces, hyphens and apostrophes only
    else if (name === "firstName" || name === "lastName") {
      // Allow common Latin letters (including accents), spaces, hyphens and apostrophes
      newValue = newValue.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [key]: newValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Define a concrete payload type for saving
  type RegistrationPayload = {
    id?: string;
    chamberName: string; // kept for compatibility, derived from first+last
    contactNumber: string;
    address: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    model?: string;
    locationYear: string;
    uniqueDecimal: string;
    deviceId: string;
    selectedDeviceId?: string;
  };

  const handleSave = () => {
    if (validateForm()) {
      // if a device was selected from availableDevices, use that deviceId and include selectedDeviceId
      const selectedDevice = selectedDeviceId
        ? availableDevices?.find((a) => a.id === selectedDeviceId)
        : undefined;
      const payloadDeviceId = selectedDevice
        ? selectedDevice.deviceId
        : deviceId;

      const registrationData: RegistrationPayload = {
        id: editingId,
        chamberName: `${formData.firstName} ${formData.lastName}`,
        contactNumber: formData.phoneNumber,
        address: "",
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        model: formData.model || undefined,
        locationYear,
        uniqueDecimal,
        deviceId: payloadDeviceId,
        ...(selectedDeviceId ? { selectedDeviceId } : {}),
      };

      console.log("Chamber and Device registered:", registrationData);
      onSave?.(registrationData);
      handleCancel();
    }
  };

  // populate when opening for edit
  useEffect(() => {
    if (open && initialData) {
      setEditingId(initialData.id);
      setFormData((prev) => ({
        ...prev,
        email: (initialData as any).email ?? "",
        firstName: (initialData as any).firstName ?? "",
        lastName: (initialData as any).lastName ?? "",
        phoneNumber: (initialData as any).phoneNumber ?? initialData.contactNumber ?? "",
        model: initialData.model ?? "",
      }));
      setSelectedDeviceId(initialData.selectedDeviceId);
      // if initialData contains an id, try to set selectedUserId so UI reflects chosen user
      if (initialData.id) setSelectedUserId(String(initialData.id))
    }
    if (!open) {
      setEditingId(undefined);
    }
  }, [open, initialData]);

  // when a user is chosen from the select, populate form fields and selected device
  const handleSelectUser = (id?: string) => {
    if (!id) {
      setSelectedUserId(undefined)
      setEditingId(undefined)
      setFormData({ email: "", firstName: "", lastName: "", phoneNumber: "", model: "" })
      setSelectedDeviceId(undefined)
      return
    }
    const u = users.find((x) => x.id === id)
    if (!u) return
    setSelectedUserId(id)
    // treat this as editing existing record
    setEditingId(u.id)
    setFormData({ email: u.email ?? "", firstName: u.firstName ?? "", lastName: u.lastName ?? "", phoneNumber: u.phoneNumber ?? u.contactNumber ?? "", model: "" })
    // try to map deviceId string to availableDevices id
    const match = availableDevices?.find((d) => d.deviceId === u.deviceId)
    setSelectedDeviceId(match?.id)
  }

  const handleCancel = () => {
    setFormData({ email: "", firstName: "", lastName: "", phoneNumber: "", model: "" });
    setSelectedUserId(undefined)
    setSelectedDeviceId(undefined)
    setEditingId(undefined)
    setErrors({});
    onOpenChange(false);
  };

  // lightweight validity check (does not set errors) used to disable Save button
  const isFormValid = () => {
    if (!selectedUserId) {
      if (!formData.email.trim()) return false
      if (!formData.firstName.trim()) return false
      if (!formData.lastName.trim()) return false
      if (!formData.phoneNumber.trim()) return false
    }

    if (!selectedDeviceId && !formData.model.trim()) return false

    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Chamber</DialogTitle>
          <DialogDescription>
            Enter chamber information and device registration details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select existing user (optional) */}
          <div>
            <Label className="text-foreground font-medium">Select existing user</Label>
            <div className="mt-2">
              <Select
                value={selectedUserId ?? "new"}
                onValueChange={(v) => handleSelectUser(v === "new" ? undefined : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      selectedUserId
                        ? users.find((u) => u.id === selectedUserId)?.name ?? ""
                        : "-- New registration --"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">-- New registration --</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name ?? u.email ?? `User ${u.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* If an existing user is selected, show read-only details */}
          {selectedUserId && (
            (() => {
              const u = users.find((x) => x.id === selectedUserId)
              if (!u) return null
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Selected User</CardTitle>
                    <CardDescription>Existing user details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{u.email ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">First name</div>
                      <div className="font-medium">{u.firstName ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Last name</div>
                      <div className="font-medium">{u.lastName ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div>{u.phoneNumber ?? u.contactNumber ?? '—'}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()
          )}
          {/* User Information Section (hidden when an existing user is selected) */}
          {!selectedUserId && (
            <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Enter contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground font-medium">First name</Label>
                  <Input id="firstName" name="firstName" placeholder="First" value={formData.firstName} onChange={handleInputChange} inputMode="text" className={errors.firstName ? "border-destructive" : ""} />
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground font-medium">Last name</Label>
                  <Input id="lastName" name="lastName" placeholder="Last" value={formData.lastName} onChange={handleInputChange} inputMode="text" className={errors.lastName ? "border-destructive" : ""} />
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-foreground font-medium">Phone number</Label>
                <Input id="phoneNumber" name="phoneNumber" placeholder="e.g. +63917..." value={formData.phoneNumber} onChange={handleInputChange} inputMode="tel" className={errors.phoneNumber ? "border-destructive" : ""} />
                {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
              </div>
            </CardContent>
            </Card>
          )}

          {/* Device Registration Section */}
          <Card>
            <CardHeader>
              <CardTitle>Device Registration</CardTitle>
              <CardDescription>
                Device ID will be auto-generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* If there are available devices, allow selecting one; otherwise generate a new ID */}
              {Array.isArray(availableDevices) ? (
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Select available device
                  </Label>
                  <Select
                    value={selectedDeviceId}
                    onValueChange={(v) => setSelectedDeviceId(v)}
                  >
                    <SelectTrigger className="w-full bg-white border rounded-md">
                      <SelectValue
                        placeholder={
                          availableDevices.length > 0
                            ? "Choose a device"
                            : "No devices available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDevices.length > 0 ? (
                        availableDevices.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-mono">{d.deviceId}</span>
                              {/* intentionally omit network status in the Registered Users dropdown */}
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
                  <div className="mt-2 space-y-2">
                    <Label className="text-foreground font-medium">
                      Device ID
                    </Label>
                    <div className="px-3 py-2 bg-primary/10 rounded-md text-foreground font-mono border border-primary/20">
                      {selectedDeviceId
                        ? availableDevices.find(
                            (a) => a.id === selectedDeviceId
                          )?.deviceId ?? "-"
                        : availableDevices.length > 0
                        ? "Select a device"
                        : "No devices available"}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Prefix
                    </Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-foreground">
                      MASH
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="model"
                      className="text-foreground font-medium"
                    >
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
                    {errors.model && (
                      <p className="text-sm text-destructive">{errors.model}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Location Year
                    </Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-foreground font-mono">
                      {locationYear || "---"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from address and current year
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Unique Decimal
                    </Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-foreground font-mono">
                      {uniqueDecimal}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Device ID
                    </Label>
                    <div className="px-3 py-2 bg-primary/10 rounded-md text-foreground font-mono border border-primary/20">
                      {deviceId}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSave}
            disabled={!isFormValid()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
