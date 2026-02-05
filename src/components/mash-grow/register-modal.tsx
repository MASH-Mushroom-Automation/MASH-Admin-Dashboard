"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
  onSave?: (data: RegisterData & { selectedDeviceId?: string; selectedUserId?: string }) => void;
  availableDevices?: { id: string; deviceId: string; status?: string }[];
  availableUsers?: { id: string; name: string; email?: string; firstName?: string; lastName?: string; contactNumber?: string; phoneNumber?: string }[];
  // optional initial data for edit
  initialData?: Partial<
    RegisterData & { id?: string; selectedDeviceId?: string }
  >;
}
// initialData may include user fields when editing an existing registration
type RegisterInitialData = Partial<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  contactNumber: string;
  model: string;
  selectedDeviceId: string;
}>;

export default function RegisterModal({
  open,
  onOpenChange,
  onSave,
  availableDevices,
  availableUsers = [],
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
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  const locationYear = "";
  const deviceId = `MASH-${formData.model || "---"}-${
    locationYear || "---"
  }-${uniqueDecimal}`;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Require user selection
    if (!selectedUserId) {
      newErrors.user = "You must select a user";
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
    selectedUserId?: string;
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
        selectedUserId, // Include selectedUserId in payload
      };

      console.log("Device assignment registered:", registrationData);
      // @ts-ignore
      onSave?.(registrationData);
      toast.success("Device assigned to user");
      handleCancel();
    }
  };

  // populate when opening for edit
  useEffect(() => {
    if (open && initialData) {
      const init = initialData as RegisterInitialData;
      setEditingId(initialData.id as string | undefined);
      setFormData((prev) => ({
        ...prev,
        email: init.email ?? "",
        firstName: init.firstName ?? "",
        lastName: init.lastName ?? "",
        phoneNumber: init.phoneNumber ?? init.contactNumber ?? "",
        model: init.model ?? "",
      }));
      setSelectedDeviceId(init.selectedDeviceId);
      // if initialData contains an id, try to set selectedUserId so UI reflects chosen user
      if (initialData.id) setSelectedUserId(String(initialData.id));
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
      return
    }
    const u = availableUsers.find((x) => x.id === id)
    if (!u) return
    setSelectedUserId(id)
    // treat this as editing existing record
    setEditingId(u.id)
    setFormData({ email: u.email ?? "", firstName: u.firstName ?? "", lastName: u.lastName ?? "", phoneNumber: u.phoneNumber ?? u.contactNumber ?? "", model: "" })
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
    if (!selectedUserId) return false
    if (!selectedDeviceId && !formData.model.trim()) return false
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Device</DialogTitle>
          <DialogDescription>
            Assign a device to an existing user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select existing user */}
          <div>
            <Label className="text-foreground font-medium">Select existing user *</Label>
            <div className="mt-2">
              <Select
                value={selectedUserId || ""}
                onValueChange={(v) => handleSelectUser(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder="Select a user..."
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name ?? u.email ?? `User ${u.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user && <p className="text-sm text-destructive mt-1">{errors.user}</p>}
            </div>
          </div>

          {/* Show read-only details for selected user */}
          {selectedUserId && (
            (() => {
              const u = availableUsers.find((x) => x.id === selectedUserId)
              if (!u) return null
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Selected User</CardTitle>
                    <CardDescription>User confirmation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{u.email ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium">{u.name ?? '—'}</div>
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
